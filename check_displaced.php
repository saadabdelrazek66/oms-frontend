<?php
require 'c:/xampp/htdocs/oms/oms-backend/vendor/autoload.php';
$app = require_once 'c:/xampp/htdocs/oms/oms-backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$displacedPosts = \App\Models\PlanPost::where('is_displaced', true)->get();
echo "Displaced posts count: " . $displacedPosts->count() . PHP_EOL;
foreach ($displacedPosts as $p) {
    echo "Post #{$p->id}: deadline={$p->deadline}, original_deadline={$p->original_deadline}, is_displaced=" . ($p->is_displaced ? '1':'0') . ", reason={$p->displaced_reason}" . PHP_EOL;
}

$displacedTasks = \App\Models\Task::where('is_displaced', true)->get();
echo "Displaced tasks count: " . $displacedTasks->count() . PHP_EOL;
foreach ($displacedTasks as $t) {
    echo "Task #{$t->id}: due_date={$t->due_date}, original_due_date={$t->original_due_date}, is_displaced=" . ($t->is_displaced ? '1':'0') . ", reason={$t->displaced_reason}" . PHP_EOL;
}
