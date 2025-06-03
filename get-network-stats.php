<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$output = shell_exec('./dashboard-overview.sh');

if ($output === null) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to execute script']);
    exit;
}

echo $output;
