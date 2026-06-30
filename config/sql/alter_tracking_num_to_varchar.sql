-- Fix: pull-out request tracking numbers not stored/displayed.
-- tracking_num was INT; courier tracking numbers are alphanumeric and often
-- longer than the INT range. Widen to VARCHAR so values store & display verbatim.
ALTER TABLE `request_tbl`
    MODIFY `tracking_num` VARCHAR(100) NULL DEFAULT NULL;
