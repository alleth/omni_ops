// src/pages/masterfile/components/BulkRequestModal.js
import React, { useState, useEffect, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import { createPortal } from 'react-dom';

const modalRoot = document.getElementById('modal-root') || (() => {
    const el = document.createElement('div');
    el.id = 'modal-root';
    document.body.appendChild(el);
    return el;
})();

const BulkRequestModal = ({
                              isOpen,
                              onClose,
                              selectedItems = [],
                              actionType,
                              siteMap,
                              regionMap,
                              allowedSites = [],
                              onSuccess,
                              postFormData,
                              user,
                          }) => {
    const [serviceRequestNo, setServiceRequestNo] = useState('');
    const [serviceRequestDate, setServiceRequestDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [reasonForTransfer, setReasonForTransfer] = useState('');
    const [transferFromAccountable, setTransferFromAccountable] = useState('');
    const [transferToAccountable, setTransferToAccountable] = useState('');
    const [transferToSiteCode, setTransferToSiteCode] = useState('');

    // Pull-out fields
    const [deliveryMethod, setDeliveryMethod] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [deliveredBy, setDeliveredBy] = useState('');
    const [pickupDate, setPickupDate] = useState('');
    const [pulloutFormFile, setPulloutFormFile] = useState(null);
    const [pulloutPreviewUrl, setPulloutPreviewUrl] = useState(null);
    const [pulloutFileInfo, setPulloutFileInfo] = useState(null);

    // Relocation fields
    const [relocationFormFile, setRelocationFormFile] = useState(null);
    const [relocationPreviewUrl, setRelocationPreviewUrl] = useState(null);
    const [relocationFileInfo, setRelocationFileInfo] = useState(null);

    const [itemReasons, setItemReasons] = useState({});

    const [submitLoading, setSubmitLoading] = useState(false);

    const pulloutFileInputRef = useRef(null);
    const relocationFileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setServiceRequestNo('');
            setServiceRequestDate('');
            setReturnDate('');
            setReasonForTransfer('');
            setTransferFromAccountable('');
            setTransferToAccountable('');
            setTransferToSiteCode('');
            setDeliveryMethod('');
            setTrackingNumber('');
            setDeliveredBy('');
            setPickupDate('');
            setPulloutFormFile(null);
            setPulloutPreviewUrl(null);
            setPulloutFileInfo(null);
            setRelocationFormFile(null);
            setRelocationPreviewUrl(null);
            setRelocationFileInfo(null);

            setItemReasons(
                selectedItems.reduce((acc, item) => {
                    acc[item.hw_id] = '';
                    return acc;
                }, {})
            );
        }

        return () => {
            if (pulloutPreviewUrl) URL.revokeObjectURL(pulloutPreviewUrl);
            if (relocationPreviewUrl) URL.revokeObjectURL(relocationPreviewUrl);
        };
    }, [isOpen, selectedItems]);

    if (!isOpen) return null;

    const isRelocation = actionType === 'relocation';

    const truncateText = (text, maxLength) => {
        if (!text) return '—';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    };

    const handleFileSelect = (file, isReloc = isRelocation) => {
        if (!file) return;

        if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
            alert('Only PDF, JPG, or PNG allowed');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
        const fileInfo = {
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            type: file.type,
        };

        if (isReloc) {
            setRelocationFormFile(file);
            setRelocationPreviewUrl(previewUrl);
            setRelocationFileInfo(fileInfo);
        } else {
            setPulloutFormFile(file);
            setPulloutPreviewUrl(previewUrl);
            setPulloutFileInfo(fileInfo);
        }
    };

    const handleDrop = (e, isReloc = isRelocation) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files[0];
        handleFileSelect(file, isReloc);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleGenerateRelocationPDF = async () => {
        if (!returnDate.trim()) return alert('Please fill Date of Transfer');
        if (!reasonForTransfer.trim()) return alert('Please fill Reason for Transfer');
        if (!transferFromAccountable.trim()) return alert('Please fill Transfer From Accountable Name');
        if (!transferToAccountable.trim()) return alert('Please fill Transfer To Accountable Name');
        if (!transferToSiteCode.trim()) return alert('Please select a destination Site');

        const fromSiteCode = selectedItems[0]?.site_code || '';
        if (transferToSiteCode === fromSiteCode) return alert('Cannot relocate to the same site.');

        try {
            const templateUrl = '/public/templates/field-relocate-template.pdf';
            const templateBytes = await fetch(templateUrl).then(res => res.arrayBuffer());
            const pdfDoc = await PDFDocument.load(templateBytes);

            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

            let currentPage = pdfDoc.getPages()[0];
            let rowIndex = 0;
            const maxRowsPerPage = 5;
            let currentRowY = 528;

            const drawText = (text, x, y, size = 10, page = currentPage) => {
                page.drawText((text ?? '—').toString(), { x, y, size, font, color: rgb(0, 0, 0) });
            };

            const addContinuationPage = () => {
                currentPage = pdfDoc.addPage(PageSizes.A4);
                currentRowY = 580;
                rowIndex = 0;

                drawText('No', 45, currentRowY + 24, 9, currentPage);
                drawText('Item Description', 90, currentRowY + 24, 9, currentPage);
                drawText('Brand', 220, currentRowY + 24, 9, currentPage);
                drawText('Model', 280, currentRowY + 24, 9, currentPage);
                drawText('Serial Number', 340, currentRowY + 24, 9, currentPage);
                drawText('Asset Number', 420, currentRowY + 24, 9, currentPage);
                drawText('Qty', 500, currentRowY + 24, 9, currentPage);
                drawText('UoM', 530, currentRowY + 24, 9, currentPage);
            };

            const firstItem = selectedItems[0] || {};
            const fromSite = siteMap[firstItem.site_code] || {};
            const fromRegionName = regionMap[String(fromSite.region_id)] || '—';
            const fromSiteDisplay = `${firstItem.site_code || '—'} – ${fromSite.site_name || '—'}`;

            const toSite = allowedSites.find(s => s.site_code === transferToSiteCode) || {};
            const toRegionName = regionMap[String(toSite.region_id)] || '—';
            const toSiteDisplay = transferToSiteCode ? `${transferToSiteCode} – ${toSite.site_name || '—'}` : '—';

            drawText(returnDate, 115, 673, 10);
            drawText(transferFromAccountable || '', 131, 637, 9);
            drawText(fromRegionName, 131, 625, 9);
            drawText(fromSiteDisplay, 131, 612, 9);

            drawText(transferToAccountable || '', 353, 637, 9);
            drawText(toRegionName, 353, 625, 9);
            drawText(toSiteDisplay, 353, 612, 9);

            drawText(truncateText(reasonForTransfer || '—', 120), 80, 575, 10);

            selectedItems.forEach((item, index) => {
                if (rowIndex >= maxRowsPerPage) addContinuationPage();
                const y = currentRowY - rowIndex * 13;
                drawText(index + 1, 48, y, 9);
                drawText(item.item_desc || '—', 64, y, 9);
                drawText(item.hw_brand_name || '—', 181, y, 9);
                drawText(item.hw_model || '—', 268, y, 9);

                const serialText = item.hw_serial_num || '—';
                const serialDisplay = serialText.length > 18 ? serialText.substring(0, 18) + '...' : serialText;
                drawText(serialDisplay, 356, y, 9);

                drawText(item.hw_asset_num || '—', 475, y, 9);
                drawText('1', 545, y, 9);
                drawText('Unit', 573, y, 9);
                rowIndex++;
            });

            const signerName = `${user?.fname || ''} ${user?.lname || ''}`.trim() || 'APPROVED BY';
            drawText(signerName.toUpperCase(), 132, 139, 10);

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const blobUrl = URL.createObjectURL(blob);

            const newWindow = window.open(blobUrl, '_blank');
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                alert('Popup blocked. Please allow popups to view the PDF.');
            }

            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        } catch (err) {
            console.error('PDF generation failed:', err);
            alert('Failed to generate PDF: ' + (err.message || 'Unknown error'));
        }
    };

    const handleGeneratePullOutPDF = async () => {
        if (!serviceRequestNo.trim()) return alert('Please enter Service Request No.');
        if (!serviceRequestDate.trim()) return alert('Please select Service Request Date');
        if (!returnDate.trim()) return alert('Please select Return Date');

        const templateUrl = '/public/templates/field-return-template.pdf';

        try {
            const templateBytes = await fetch(templateUrl).then(res => {
                if (!res.ok) throw new Error(`Template not found: ${res.status} ${res.statusText}`);
                return res.arrayBuffer();
            });

            const pdfDoc = await PDFDocument.load(templateBytes);
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

            let currentPage = pdfDoc.getPages()[0];
            const drawText = (text, x, y, size = 10, page = currentPage) => {
                page.drawText((text ?? '—').toString(), { x, y, size, font, color: rgb(0, 0, 0) });
            };

            // ── Fill header fields ──
            drawText(serviceRequestNo,   400, 525, 10);
            drawText(serviceRequestDate, 400, 508, 10);
            drawText(returnDate,         130, 556, 10);

            const firstItem  = selectedItems[0] || {};
            const fromSite   = siteMap[firstItem.site_code] || {};
            const regionName = regionMap[String(fromSite.region_id)] || '—';
            const siteCode   = firstItem.site_code || '—';
            const siteName   = truncateText(fromSite.site_name || '—', 35);

            drawText(regionName, 100, 525, 10);   // Region No.
            drawText(siteName,   100, 508, 10);   // Site Name
            drawText(siteCode,   100, 491, 10);   // Site Code

            // ── Items Table ──
            const firstRowY = 430;
            const rowHeight = 16;
            const maxRowsPerPage = 12;

            let rowIndex = 0;
            let currentY = firstRowY;

            const addNewPageIfNeeded = () => {
                if (rowIndex >= maxRowsPerPage) {
                    currentPage = pdfDoc.addPage(PageSizes.A4);
                    currentY = 720;
                    rowIndex = 0;
                }
            };

            selectedItems.forEach((item, index) => {
                addNewPageIfNeeded();

                const thisY = currentY - rowIndex * rowHeight;

                drawText((index + 1).toString(), 58, thisY, 9);                    // Item No.
                drawText('1', 84, thisY, 9);                                      // Qty
                drawText(truncateText(item.item_desc || '—', 40), 100, thisY, 9);  // Item Description

                // Brand/Model
                let brandModelRaw = `${item.hw_brand_name || ''} ${item.hw_model || ''}`.trim() || '—';
                const brandModel = brandModelRaw.length < 9
                    ? brandModelRaw
                    : brandModelRaw.substring(0, 9) + '...';
                drawText(brandModel, 185, thisY, 9);                             // Brand/Model

                drawText(truncateText(item.hw_serial_num || '—', 25), 243, thisY, 9); // Serial No.
                drawText(truncateText(item.hw_asset_num || '—', 20), 340, thisY, 9);  // Asset No.

                // Reason / Remarks - updated truncation: 35 chars + ... if longer
                const reasonRaw = itemReasons[item.hw_id]?.trim() || '—';
                const reasonDisplay = reasonRaw.length <= 35
                    ? reasonRaw
                    : reasonRaw.substring(0, 35) + '...';
                drawText(reasonDisplay, 397, thisY, 9);                           // Reason / Remarks

                rowIndex++;
            });

            const signerName = `${user?.fname || ''} ${user?.lname || ''}`.trim() || 'REQUESTED BY';
            drawText(signerName.toUpperCase(), 170, 285, 9);

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const blobUrl = URL.createObjectURL(blob);

            const newWindow = window.open(blobUrl, '_blank');
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                alert('Popup blocked. Please allow popups to view the PDF.');
            }

            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        } catch (err) {
            console.error('Pull Out PDF generation failed:', err);
            alert(
                `Failed to generate Pull Out PDF:\n${err.message}\n\n` +
                `Check if template exists at: ${templateUrl}\n` +
                `(File should be in public/templates/)`
            );
        }
    };

    const handleSubmitRelocation = async () => {
        if (!relocationFormFile) return alert('Please upload the relocation form (PDF/Image)');

        setSubmitLoading(true);

        try {
            const now = new Date();
            const mysqlDatetime = now.toISOString().slice(0, 19).replace('T', ' ');

            const requestData = {
                request_type: 'RELOCATION',
                requested_by: user?.id || user?.user_id || 1,
                requested_at: mysqlDatetime,
                updated_at: mysqlDatetime,
                status: 'PENDING',

                date_transfer: returnDate || null,
                transfer_from_name: transferFromAccountable.trim() || null,
                transfer_to_name: transferToAccountable.trim() || null,
                destination_site: transferToSiteCode || null,
                remarks: reasonForTransfer.trim() || null,

                site_code: selectedItems[0]?.site_code || null,
                quantity: selectedItems.length,

                asset_num: selectedItems[0]?.hw_asset_num || null,
                serial_num: selectedItems[0]?.hw_serial_num || null,
                item_desc: selectedItems[0]?.item_desc || null,
                hw_brand_name: selectedItems[0]?.hw_brand_name || null,
                hw_model: selectedItems[0]?.hw_model || null,

                items: selectedItems.map(item => ({
                    hw_id: item.hw_id || null,
                    site_code: item.site_code || null,
                    asset_num: item.hw_asset_num || null,
                    serial_num: item.hw_serial_num || null,
                    item_desc: item.item_desc || null,
                    hw_brand_name: item.hw_brand_name || null,
                    hw_model: item.hw_model || null,
                    quantity: 1,
                })),
            };

            const formData = new FormData();
            formData.append('data', JSON.stringify(requestData));
            formData.append('attachment', relocationFormFile);

            console.log("Sending relocation payload:", requestData);

            const result = await postFormData('/api/request-tbl/add.json', formData);
            console.log('Relocation submission response:', result);

            if (result && result.success === true) {
                alert('Relocation Request submitted successfully!');
                onSuccess?.();
                onClose();
            } else {
                const errorMsg = result?.message || 'Unknown server response';
                alert('Failed to submit relocation request: ' + errorMsg);
            }
        } catch (err) {
            console.error('Relocation submit failed:', err);
            alert('Failed to submit relocation: ' + (err.message || 'Unknown error'));
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleSubmitPullOutRequest = async () => {
        if (!deliveryMethod) return alert('Please select delivery method');
        if (deliveryMethod === 'courier' && !trackingNumber.trim()) return alert('Please enter tracking number');
        if (deliveryMethod === 'personal') {
            if (!deliveredBy.trim()) return alert('Please enter delivered by name');
            if (!pickupDate.trim()) return alert('Please select pickup date');
        }
        if (!pulloutFormFile) return alert('Please upload pullout form');

        const now = new Date();
        const mysqlDatetime = now.toISOString().slice(0, 19).replace('T', ' ');

        const requestData = {
            request_type: 'PULL_OUT',
            requested_by: user?.id || user?.user_id || 1,
            requested_at: mysqlDatetime,
            updated_at: mysqlDatetime,
            sr_num: serviceRequestNo ? Number(serviceRequestNo) : null,
            sr_date: serviceRequestDate || null,
            return_date: returnDate || null,
            delivery_method: deliveryMethod || null,
            tracking_num: deliveryMethod === 'courier' ? trackingNumber : null,
            delivered_by: deliveryMethod === 'personal' ? deliveredBy : null,
            pickup_date: deliveryMethod === 'personal' ? pickupDate : null,
            site_code: selectedItems[0]?.site_code || null,
            asset_num: selectedItems[0]?.hw_asset_num || null,
            serial_num: selectedItems[0]?.hw_serial_num || null,
            item_desc: selectedItems[0]?.item_desc || null,
            hw_brand_name: selectedItems[0]?.hw_brand_name || null,
            hw_model: selectedItems[0]?.hw_model || null,
            quantity: selectedItems.length,
            remarks: selectedItems.length === 1
                ? (itemReasons[selectedItems[0].hw_id]?.trim() || null)
                : selectedItems.map(it => itemReasons[it.hw_id]?.trim() || '').join('; ') || null,
            attachment_path: null,
            items: selectedItems.map(item => ({
                hw_id: item.hw_id || null,
                site_code: item.site_code || null,
                asset_num: item.hw_asset_num || null,
                serial_num: item.hw_serial_num || null,
                item_desc: item.item_desc || null,
                hw_brand_name: item.hw_brand_name || null,
                hw_model: item.hw_model || null,
                quantity: 1,
                remarks: itemReasons[item.hw_id]?.trim() || null,
            })),
        };

        try {
            setSubmitLoading(true);
            const formData = new FormData();
            formData.append('data', JSON.stringify(requestData));
            formData.append('attachment', pulloutFormFile);

            const result = await postFormData('/api/request-tbl/add.json', formData);

            if (result && result.success === true) {
                alert('Pull Out Request submitted successfully!');
                onSuccess?.();
                onClose();
            } else {
                alert('Failed to submit pull-out request: ' + (result?.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Pull-out submit failed:', err);
            alert('Failed to submit pull-out request: ' + (err.message || 'Network/server error'));
        } finally {
            setSubmitLoading(false);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={onClose}
        >
            <div
                className={`
          relative w-full max-w-4xl mx-4 rounded-2xl shadow-2xl ring-1 overflow-hidden
          transform transition-all duration-300 ease-out
          ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 ring-gray-200/70 dark:ring-gray-700/50
        `}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/80 dark:bg-gray-900/50">
                    <h2 className="text-xl font-semibold tracking-tight">
                        {isRelocation ? 'Relocation Request' : 'Pull Out Request'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full transition-colors text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="p-6 pb-28 md:pb-6 overflow-y-auto max-h-[calc(85vh-140px)]">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Left: File upload dropzone */}
                        <div className="md:w-2/5 lg:w-1/3 space-y-4">
                            {isRelocation ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Upload Relocation Form <span className="text-red-500">*</span>
                                    </label>
                                    <div
                                        onClick={() => relocationFileInputRef.current?.click()}
                                        onDrop={(e) => handleDrop(e, true)}
                                        onDragOver={handleDragOver}
                                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all min-h-[260px] flex items-center justify-center ${
                                            relocationFormFile
                                                ? 'border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                                                : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/15'
                                        }`}
                                    >
                                        {!relocationFormFile ? (
                                            <div className="space-y-3">
                                                <div className="text-5xl text-indigo-400 dark:text-indigo-500">+</div>
                                                <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                                                    Click or drag file here
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    PDF, JPG, PNG • Max 5MB
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 w-full">
                                                {relocationPreviewUrl && relocationFormFile.type.startsWith('image/') ? (
                                                    <img
                                                        src={relocationPreviewUrl}
                                                        alt="Preview"
                                                        className="max-h-52 w-auto object-contain rounded shadow-sm border border-gray-200 dark:border-gray-700"
                                                    />
                                                ) : (
                                                    <div className="text-center">
                                                        <svg className="w-16 h-16 mx-auto text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4z" />
                                                        </svg>
                                                        <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                                                            {relocationFileInfo?.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{relocationFileInfo?.size}</p>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setRelocationFormFile(null);
                                                        setRelocationPreviewUrl(null);
                                                        setRelocationFileInfo(null);
                                                    }}
                                                    className="mt-1 px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={relocationFileInputRef}
                                        type="file"
                                        accept="application/pdf,image/jpeg,image/png"
                                        onChange={(e) => handleFileSelect(e.target.files[0], true)}
                                        className="hidden"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Upload Pullout Form <span className="text-red-500">*</span>
                                    </label>
                                    <div
                                        onClick={() => pulloutFileInputRef.current?.click()}
                                        onDrop={(e) => handleDrop(e, false)}
                                        onDragOver={handleDragOver}
                                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all min-h-[260px] flex items-center justify-center ${
                                            pulloutFormFile
                                                ? 'border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                                                : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/15'
                                        }`}
                                    >
                                        {!pulloutFormFile ? (
                                            <div className="space-y-3">
                                                <div className="text-5xl text-indigo-400 dark:text-indigo-500">+</div>
                                                <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                                                    Click or drag file here
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    PDF, JPG, PNG • Max 5MB
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 w-full">
                                                {pulloutPreviewUrl && pulloutFormFile.type.startsWith('image/') ? (
                                                    <img
                                                        src={pulloutPreviewUrl}
                                                        alt="Preview"
                                                        className="max-h-52 w-auto object-contain rounded shadow-sm border border-gray-200 dark:border-gray-700"
                                                    />
                                                ) : (
                                                    <div className="text-center">
                                                        <svg className="w-16 h-16 mx-auto text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4z" />
                                                        </svg>
                                                        <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                                                            {pulloutFileInfo?.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{pulloutFileInfo?.size}</p>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPulloutFormFile(null);
                                                        setPulloutPreviewUrl(null);
                                                        setPulloutFileInfo(null);
                                                    }}
                                                    className="mt-1 px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={pulloutFileInputRef}
                                        type="file"
                                        accept="application/pdf,image/jpeg,image/png"
                                        onChange={(e) => handleFileSelect(e.target.files[0], false)}
                                        className="hidden"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Right: Form fields */}
                        <div className="md:w-3/5 lg:w-2/3 space-y-5">
                            {/* Dates */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {!isRelocation && (
                                    <div className="space-y-1">
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                            Service Request No. <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={serviceRequestNo}
                                            onChange={e => setServiceRequestNo(e.target.value)}
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-indigo-400 focus:ring-1 outline-none"
                                            placeholder="Enter number"
                                        />
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                        {isRelocation ? 'Date of Transfer' : 'Service Request Date'} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={isRelocation ? returnDate : serviceRequestDate}
                                        onChange={e => isRelocation ? setReturnDate(e.target.value) : setServiceRequestDate(e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-indigo-400 focus:ring-1 outline-none"
                                    />
                                </div>

                                {!isRelocation && (
                                    <div className="space-y-1">
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                            Return Date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={returnDate}
                                            onChange={e => setReturnDate(e.target.value)}
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-indigo-400 focus:ring-1 outline-none"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Delivery Method - only for Pull Out */}
                            {!isRelocation && (
                                <div className="space-y-5">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        Delivery Method <span className="text-red-500">*</span>
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <label className="flex items-center space-x-3">
                                            <input
                                                type="radio"
                                                name="deliveryMethod"
                                                value="courier"
                                                checked={deliveryMethod === 'courier'}
                                                onChange={e => setDeliveryMethod(e.target.value)}
                                                className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Courier</span>
                                        </label>
                                        <label className="flex items-center space-x-3">
                                            <input
                                                type="radio"
                                                name="deliveryMethod"
                                                value="personal"
                                                checked={deliveryMethod === 'personal'}
                                                onChange={e => setDeliveryMethod(e.target.value)}
                                                className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Personal Pickup</span>
                                        </label>
                                    </div>

                                    {/* Courier fields */}
                                    {deliveryMethod === 'courier' && (
                                        <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                                    Tracking Number <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={trackingNumber}
                                                    onChange={e => setTrackingNumber(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-indigo-400 focus:ring-1 outline-none"
                                                    placeholder="Enter tracking number"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Personal Pickup fields */}
                                    {deliveryMethod === 'personal' && (
                                        <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                                    Delivered By <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={deliveredBy}
                                                    onChange={e => setDeliveredBy(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-indigo-400 focus:ring-1 outline-none"
                                                    placeholder="Name of person delivering"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                                    Pickup Date <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    value={pickupDate}
                                                    onChange={e => setPickupDate(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-indigo-400 focus:ring-1 outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Reason */}
                            <div className="space-y-5">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {isRelocation ? 'Reason for Transfer' : 'Reason for Return'}
                                </h4>

                                {isRelocation ? (
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                                Reason <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                value={reasonForTransfer}
                                                onChange={e => setReasonForTransfer(e.target.value)}
                                                rows={2}
                                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-indigo-400 focus:ring-1 outline-none resize-none"
                                                placeholder="Enter reason..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            {selectedItems.map(item => (
                                                <div key={item.hw_id} className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 p-3 text-sm">
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                        <div><span className="text-xs text-gray-500">Type</span><p className="font-medium truncate">{item.item_desc || '—'}</p></div>
                                                        <div><span className="text-xs text-gray-500">Brand & Model</span><p className="font-medium truncate">{item.hw_brand_name || '—'} {item.hw_model || ''}</p></div>
                                                        <div><span className="text-xs text-gray-500">Serial</span><p className="font-medium truncate">{item.hw_serial_num || '—'}</p></div>
                                                        <div><span className="text-xs text-gray-500">Asset</span><p className="font-medium truncate">{item.hw_asset_num || '—'}</p></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    selectedItems.map(item => (
                                        <div key={item.hw_id} className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 p-3 text-sm">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                                                <div><span className="text-xs text-gray-500">Type</span><p className="font-medium truncate">{item.item_desc || '—'}</p></div>
                                                <div><span className="text-xs text-gray-500">Brand & Model</span><p className="font-medium truncate">{item.hw_brand_name || '—'} {item.hw_model || ''}</p></div>
                                                <div><span className="text-xs text-gray-500">Serial</span><p className="font-medium truncate">{item.hw_serial_num || '—'}</p></div>
                                                <div><span className="text-xs text-gray-500">Asset</span><p className="font-medium truncate">{item.hw_asset_num || '—'}</p></div>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                                    Reason <span className="text-red-500">*</span>
                                                </label>
                                                <textarea
                                                    value={itemReasons[item.hw_id] || ''}
                                                    onChange={e => setItemReasons({ ...itemReasons, [item.hw_id]: e.target.value })}
                                                    rows={2}
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-indigo-400 focus:ring-1 outline-none resize-none"
                                                    placeholder="Enter reason for this item..."
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Transfer From / To */}
                            {isRelocation && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-medium text-gray-900 dark:text-gray-100">Transfer From</h4>
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                                Accountable Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={transferFromAccountable}
                                                onChange={e => setTransferFromAccountable(e.target.value)}
                                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-indigo-400 focus:ring-1 outline-none"
                                                placeholder="Enter name"
                                            />
                                        </div>

                                        {/* NEW: Display current source site below Accountable Name */}
                                        <div className="space-y-1 text-xs">
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                                Current Site
                                            </label>
                                            <div className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                                                {selectedItems.length > 0 && selectedItems[0]?.site_code
                                                    ? `${selectedItems[0].site_code} – ${siteMap[selectedItems[0].site_code]?.site_name || 'Unnamed'}`
                                                    : '—'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-xs font-medium text-gray-900 dark:text-gray-100">Transfer To</h4>
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                                Accountable Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={transferToAccountable}
                                                onChange={e => setTransferToAccountable(e.target.value)}
                                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-indigo-400 focus:ring-1 outline-none"
                                                placeholder="Enter name"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                                Destination Site <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={transferToSiteCode}
                                                onChange={e => setTransferToSiteCode(e.target.value)}
                                                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-indigo-400 focus:ring-1 outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="">Select site</option>
                                                {allowedSites.map(site => (
                                                    <option key={site.site_code} value={site.site_code}>
                                                        {site.site_code} – {site.site_name || 'Unnamed'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-5 pb-8 px-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky bottom-0">
                    <div className="flex justify-end gap-4">
                        <button
                            onClick={onClose}
                            disabled={submitLoading}
                            className="px-6 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>

                        {isRelocation ? (
                            <>
                                <button
                                    onClick={handleGenerateRelocationPDF}
                                    disabled={submitLoading}
                                    className="px-6 py-2.5 text-sm font-medium bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors shadow-sm"
                                >
                                    Generate PDF
                                </button>

                                <button
                                    onClick={handleSubmitRelocation}
                                    disabled={submitLoading || !relocationFormFile}
                                    className={`px-6 py-2.5 text-sm font-medium rounded-lg shadow-sm transition-colors ${
                                        submitLoading || !relocationFormFile ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                                    } text-white`}
                                >
                                    {submitLoading ? 'Submitting...' : 'Submit'}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleGeneratePullOutPDF}
                                    disabled={submitLoading}
                                    className="px-6 py-2.5 text-sm font-medium bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors shadow-sm"
                                >
                                    Generate PDF
                                </button>

                                <button
                                    onClick={handleSubmitPullOutRequest}
                                    disabled={
                                        submitLoading ||
                                        !deliveryMethod ||
                                        (deliveryMethod === 'courier' && !trackingNumber.trim()) ||
                                        (deliveryMethod === 'personal' && (!deliveredBy.trim() || !pickupDate.trim())) ||
                                        !pulloutFormFile
                                    }
                                    className={`px-6 py-2.5 text-sm font-medium rounded-lg shadow-sm transition-colors ${
                                        submitLoading || !pulloutFormFile || !deliveryMethod ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                                    } text-white`}
                                >
                                    {submitLoading ? 'Submitting...' : 'Submit'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        modalRoot
    );
};

export default BulkRequestModal;
