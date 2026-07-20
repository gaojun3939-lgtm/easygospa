// 服务半径闸门验证(老板 2026-07-20 拍板 10 km,方案C):
// 墙上超距不显示;距离未知不拦浏览;下单时超距必须被拦(UI 断言)。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  MAX_SERVICE_DISTANCE_KM,
  isTherapistWithinServiceRange,
  therapistDistanceKm,
  filterTherapistsForWall,
  ALL_SERVICE_TYPES_VALUE
} from '../src/lib/therapistServiceBookingFlow.mjs';

assert.equal(MAX_SERVICE_DISTANCE_KM, 10, '服务半径必须是老板拍板的 10 km');

// 1) 纯函数:范围内/外/未知
assert.equal(isTherapistWithinServiceRange({ distanceKm: 6 }), true, '6km 应在范围内');
assert.equal(isTherapistWithinServiceRange({ distanceKm: 10 }), true, '正好 10km 应算范围内');
assert.equal(isTherapistWithinServiceRange({ distanceKm: 11 }), false, '11km 必须被拦');
assert.equal(isTherapistWithinServiceRange({ distanceKm: 566 }), false, '566km 必须被拦');
assert.equal(isTherapistWithinServiceRange({}), true, '距离未知不在这一层拦(方案C)');
assert.equal(therapistDistanceKm({ approxDistanceKm: 2.5 }), 2.5, '应认 approxDistanceKm');
assert.equal(therapistDistanceKm({}), null, '无距离返回 null');

// 2) 技师墙:超距技师不得出现
const therapists = [
  { id: 'near-1', name: 'Near', distanceKm: 3, serviceAreas: ['Makati'], availableServices: ['Swedish'], specialties: [] },
  { id: 'edge-1', name: 'Edge', distanceKm: 10, serviceAreas: ['BGC'], availableServices: ['Swedish'], specialties: [] },
  { id: 'far-1', name: 'Far', distanceKm: 25, serviceAreas: ['Makati'], availableServices: ['Swedish'], specialties: [] },
  { id: 'absurd', name: 'Absurd', distanceKm: 566, serviceAreas: ['Makati'], availableServices: ['Swedish'], specialties: [] },
  { id: 'unknown', name: 'Unknown', serviceAreas: ['Makati'], availableServices: ['Swedish'], specialties: [] }
];
const wall = filterTherapistsForWall({ therapists, serviceType: ALL_SERVICE_TYPES_VALUE });
const names = wall.map(item => item.name);
assert.ok(names.includes('Near') && names.includes('Edge'), '范围内技师必须显示');
assert.ok(names.includes('Unknown'), '距离未知的技师仍可浏览');
assert.ok(!names.includes('Far'), '25km 技师不得出现在墙上');
assert.ok(!names.includes('Absurd'), '566km 技师不得出现在墙上');

// 3) UI:区域下拉已删除、Service type 仍在、下单有超距拦截
const modal = fs.readFileSync(new URL('../src/components/BookingModal.jsx', import.meta.url), 'utf8');
assert.ok(!modal.includes('therapist-area-filter'), '区域筛选下拉必须已删除');
assert.ok(!modal.includes('>All service areas<'), '不得再出现 All service areas 选项');
assert.ok(modal.includes('therapist-servicetype-filter'), 'Service type 筛选必须保留');
assert.ok(modal.includes('wall-sort-nearby') && modal.includes('wall-sort-popular'), 'Nearby / Most booked 排序必须保留');
assert.ok(modal.includes('MAX_SERVICE_DISTANCE_KM') && modal.includes('therapistDistanceKm'), '下单流程必须引用服务半径闸门');
assert.ok(/outside our \$\{MAX_SERVICE_DISTANCE_KM\} km service range/.test(modal), '超距下单必须给出明确拦截文案');

console.log('SERVICE_RADIUS_GATE_CHECK_PASS');
