<?php
require 'c:/xampp/htdocs/oms/oms-backend/vendor/autoload.php';
$app = require_once 'c:/xampp/htdocs/oms/oms-backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$service = app(\App\Services\WorkloadCascadingService::class);
$schedule = $service->getEmployeeDaySchedule(8, '2026-10-07');
echo "Total hours for user 8 on 2026-10-07: " . $schedule['total_hours'] . PHP_EOL;
foreach ($schedule['plan_posts'] as $p) {
    echo "Post #{$p->id}: {$p->post_type} ({$p->estimated_hours}h), deadline: {$p->deadline}, target_date: {$p->target_date}, urgent: " . ($p->is_urgent ? 'YES' : 'NO') . ", displaced: " . ($p->is_displaced ? 'YES' : 'NO') . PHP_EOL;
}
foreach ($schedule['tasks'] as $t) {
    echo "Task #{$t->id}: {$t->title} ({$t->estimated_hours}h), due: {$t->due_date}, urgent: " . ($t->is_urgent ? 'YES' : 'NO') . PHP_EOL;
}
