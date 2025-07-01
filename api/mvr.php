<?php
header('Content-Type: application/json; charset=UTF-8');

$zone    = $_GET['zone']    ?? '';
$dataset = $_GET['dataset'] ?? '';
$afterId = isset($_GET['after_id']) ? (int)$_GET['after_id'] : 0;

// Деморежим
if ($dataset) {
    $path = __DIR__ . "/../data/dataset{$dataset}/mvr.json";
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
    $sql = "SELECT id, x, y, length, krat FROM mvr WHERE zone = :zone";
    if ($afterId) {
        $sql .= " AND id > :after";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':zone'=>$zone, ':after'=>$afterId]);
    } else {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':zone'=>$zone]);
    }
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo json_encode([]);
}