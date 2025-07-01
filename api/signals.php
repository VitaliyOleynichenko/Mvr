<?php
header('Content-Type: application/json; charset=UTF-8');

$zone    = $_GET['zone']    ?? '';
$dataset = $_GET['dataset'] ?? '';

// Деморежим
if ($dataset) {
    $path = __DIR__ . "/../data/dataset{$dataset}/signals.json";
    if (file_exists($path)) {
        echo file_get_contents($path);
        exit;
    }
}

// Живая БД
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=yourdb;charset=utf8',
        'user','pass',
        [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]
    );
    $stmt = $pdo->prepare(
      "SELECT state FROM signals WHERE zone = :zone LIMIT 1"
    );
    $stmt->execute([':zone'=>$zone]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode($row ?: ['state'=>'idle']);
} catch (Exception $e) {
    echo json_encode(['state'=>'idle']);
}