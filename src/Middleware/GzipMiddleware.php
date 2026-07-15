<?php
declare(strict_types=1);

namespace App\Middleware;

use Laminas\Diactoros\Stream;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Gzip-compresses /api JSON responses when the client supports it.
 *
 * Apache mod_deflate is not enabled in the XAMPP setups this app runs on,
 * so large payloads (e.g. the full hw-tbl list) would otherwise travel
 * uncompressed. Compressing here keeps the behavior independent of the
 * web server configuration.
 */
class GzipMiddleware implements MiddlewareInterface
{
    /**
     * Responses smaller than this aren't worth compressing.
     */
    private const MIN_LENGTH = 1024;

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $response = $handler->handle($request);

        if (!str_starts_with($request->getUri()->getPath(), '/api')) {
            return $response;
        }

        if (stripos($request->getHeaderLine('Accept-Encoding'), 'gzip') === false) {
            return $response;
        }

        if ($response->hasHeader('Content-Encoding')) {
            return $response;
        }

        $contentType = $response->getHeaderLine('Content-Type');
        if ($contentType !== '' && !preg_match('/json|text|javascript|xml/i', $contentType)) {
            return $response;
        }

        $body = (string)$response->getBody();
        if (strlen($body) < self::MIN_LENGTH) {
            return $response;
        }

        $compressed = gzencode($body, 6);
        if ($compressed === false) {
            return $response;
        }

        $stream = new Stream('php://temp', 'wb+');
        $stream->write($compressed);
        $stream->rewind();

        return $response
            ->withBody($stream)
            ->withHeader('Content-Encoding', 'gzip')
            ->withAddedHeader('Vary', 'Accept-Encoding')
            ->withHeader('Content-Length', (string)strlen($compressed));
    }
}
