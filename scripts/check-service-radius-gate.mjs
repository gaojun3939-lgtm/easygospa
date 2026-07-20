// 服务半径闸门验证(老板 2026-07-20 拍板 10 km,方案C):
// ⚠️ 超距技师必须**留在墙上**(藏了墙就空,客人会走),只是点不动;
// 距离未知仍留在墙上可浏览,但不得点进下单;提交前再做一次守卫。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as bookingFlow from '../src/lib/therapistServiceBookingFlow.mjs';
import { normalizeWebsiteBookingRequest } from '../src/lib/bookingRequestPayload.mjs';

const websiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const adminRoot = path.resolve(websiteRoot, '..', 'ai-office-admin');

registerHooks({
  resolve(specifier, context, nextResolve) {
    const adminRootUrl = pathToFileURL(adminRoot).href;
    if (context.parentURL?.startsWith(adminRootUrl) && (specifier.startsWith('./') || specifier.startsWith('../'))) {
      const base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
      const candidates = [base, `${base}.js`, `${base}.mjs`, `${base}.jsx`, path.join(base, 'index.js')];
      const match = candidates.find(candidate => existsSync(candidate));
      if (match) return { url: pathToFileURL(match).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  }
});

const {
  MAX_SERVICE_DISTANCE_KM,
  SERVICE_RADIUS_LOCATION_REQUIRED_MESSAGE,
  SERVICE_RADIUS_TOO_FAR_MESSAGE,
  getTherapistServiceRadiusBlockMessage,
  submitBookingWithinServiceRadius,
  isTherapistWithinServiceRange,
  therapistDistanceKm,
  filterTherapistsForWall,
  ALL_SERVICE_TYPES_VALUE
} = bookingFlow;

assert.equal(MAX_SERVICE_DISTANCE_KM, 10, '服务半径必须是老板拍板的 10 km');
const backendRadiusModule = await import(pathToFileURL(path.join(adminRoot, 'lib/bookings/publicBookingServiceRadius.js')).href);
assert.equal(backendRadiusModule.MAX_SERVICE_DISTANCE_KM, MAX_SERVICE_DISTANCE_KM, '后台与官网服务半径常量必须相等');

// 1) 纯函数:边界 10.0 含等于;算不出距离与 >10 km 都拒绝。
assert.equal(isTherapistWithinServiceRange({ distanceKm: 9.9 }), true, '9.9km 应在范围内');
assert.equal(isTherapistWithinServiceRange({ distanceKm: 10 }), true, '正好 10.0km 应算范围内');
assert.equal(isTherapistWithinServiceRange({ distanceKm: 10.1 }), false, '10.1km 必须被拦');
assert.equal(isTherapistWithinServiceRange({ distanceKm: 566 }), false, '566km 必须被拦');
assert.equal(isTherapistWithinServiceRange({}), false, '距离未知必须被拦');
assert.equal(therapistDistanceKm({ approxDistanceKm: 2.5 }), 2.5, '应认 approxDistanceKm');
assert.equal(therapistDistanceKm({}), null, '无距离返回 null');
assert.equal(SERVICE_RADIUS_LOCATION_REQUIRED_MESSAGE, 'Please confirm your location first');
assert.equal(SERVICE_RADIUS_TOO_FAR_MESSAGE, 'Please select a nearby therapist within 10 km.');
assert.equal(getTherapistServiceRadiusBlockMessage({}), SERVICE_RADIUS_LOCATION_REQUIRED_MESSAGE, '未知距离必须提示确认位置');
assert.equal(getTherapistServiceRadiusBlockMessage({ distanceKm: 10 }), '', '10.0km 不应提示拦截');
assert.equal(getTherapistServiceRadiusBlockMessage({ distanceKm: 10.1 }), SERVICE_RADIUS_TOO_FAR_MESSAGE, '10.1km 必须提示选附近技师');
assert.equal(getTherapistServiceRadiusBlockMessage({ distanceKm: 566 }), SERVICE_RADIUS_TOO_FAR_MESSAGE, '566km 必须提示选附近技师');

// 2) 提交二次守卫:无客人坐标不得调用 fetch/提交函数。
let submitCalls = 0;
const submitSpy = async () => {
  submitCalls += 1;
  return { ok: true };
};
const missingCoordsResult = await submitBookingWithinServiceRadius({
  therapist: { distanceKm: 2 },
  customerLocation: null,
  submit: submitSpy
});
assert.deepEqual(missingCoordsResult, {
  ok: false,
  error: SERVICE_RADIUS_LOCATION_REQUIRED_MESSAGE,
  response: null
}, '缺客人坐标必须在网络请求前拒绝');
assert.equal(submitCalls, 0, '缺客人坐标时不得调用 fetch/提交函数');

for (const distanceKm of [9.9, 10]) {
  const allowed = await submitBookingWithinServiceRadius({
    therapist: { distanceKm },
    customerLocation: { latitude: 14.5547, longitude: 121.0244 },
    submit: submitSpy
  });
  assert.equal(allowed.ok, true, `${distanceKm}km 应允许提交`);
}
assert.equal(submitCalls, 2, '9.9km 与 10.0km 各调用一次提交函数');

const blockedSubmitResults = [];
for (const distanceKm of [10.1, 566]) {
  const blocked = await submitBookingWithinServiceRadius({
    therapist: { distanceKm },
    customerLocation: { latitude: 14.5547, longitude: 121.0244 },
    submit: submitSpy
  });
  assert.equal(blocked.ok, false, `${distanceKm}km 必须在网络请求前拒绝`);
  assert.equal(blocked.error, SERVICE_RADIUS_TOO_FAR_MESSAGE);
  blockedSubmitResults.push({ distanceKm, blocked });
}
assert.equal(submitCalls, 2, '10.1km 与 566km 都不得调用 fetch/提交函数');

// 3) 客户端 distanceKm 不得转发给后台。
const normalizedPayload = normalizeWebsiteBookingRequest({
  customerName: 'Radius Gate Test',
  customerEmail: 'radius@example.com',
  phone: '+639171234567',
  service: 'Swedish Massage',
  durationMinutes: 60,
  totalAmount: 2500,
  preferredDate: '2026-07-21',
  preferredTime: '20:00',
  area: 'Makati',
  addressNote: 'Test Condo',
  requestedTechnicianId: 'therapist-test',
  requestedTechnicianProfileId: 'therapist-test',
  distanceKm: 1,
  metadata: { distanceKm: 1 }
});
assert.equal(JSON.stringify(normalizedPayload).includes('distanceKm'), false, '客户端 distanceKm 不得转发');

console.log(`[radius-negative] distance=unknown within=${isTherapistWithinServiceRange({})} message="${getTherapistServiceRadiusBlockMessage({})}" missing_coords_submit_calls=0`);
console.log(`[radius-allowed] distance=9.9 within=${isTherapistWithinServiceRange({ distanceKm: 9.9 })} submit_ok=true`);
console.log(`[radius-boundary] distance=10.0 within=${isTherapistWithinServiceRange({ distanceKm: 10 })} submit_ok=true allowed_submit_calls=${submitCalls}`);
for (const { distanceKm, blocked } of blockedSubmitResults) {
  console.log(`[radius-negative] distance=${distanceKm} within=${isTherapistWithinServiceRange({ distanceKm })} submit_ok=${blocked.ok} message="${blocked.error}"`);
}
console.log(`[radius-untrusted-client-field] forwarded_distanceKm=${JSON.stringify(normalizedPayload).includes('distanceKm')}`);
console.log(`[radius-constants] backend=${backendRadiusModule.MAX_SERVICE_DISTANCE_KM} website=${MAX_SERVICE_DISTANCE_KM} equal=true`);

// 4) 技师墙:超距与距离未知的技师照常出现(只是卡片上点不动)
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
assert.ok(names.includes('Far'), '25km 技师必须留在墙上(不许藏,否则墙会空)');
assert.ok(names.includes('Absurd'), '566km 技师也留在墙上,只是点不动');
assert.equal(wall.length, therapists.length, '墙不做距离过滤,一个都不能少');

// 5) UI:区域下拉已删除、Service type 仍在、卡片与提交都有距离拦截
const modal = fs.readFileSync(new URL('../src/components/BookingModal.jsx', import.meta.url), 'utf8');
assert.ok(!modal.includes('therapist-area-filter'), '区域筛选下拉必须已删除');
assert.ok(!modal.includes('>All service areas<'), '不得再出现 All service areas 选项');
assert.ok(modal.includes('therapist-servicetype-filter'), 'Service type 筛选必须保留');
assert.ok(modal.includes('wall-sort-nearby') && modal.includes('wall-sort-popular'), 'Nearby / Most booked 排序必须保留');
assert.ok(modal.includes('MAX_SERVICE_DISTANCE_KM') && modal.includes('therapistDistanceKm'), '下单流程必须引用服务半径闸门');
assert.ok(modal.includes('submitBookingWithinServiceRadius'), '提交必须走服务半径二次守卫');
// 卡片层:超距/未知距离点不动 + 精确提示 + 灰按钮 + Too far 标记
assert.ok(/if \(rangeBlocked\) \{[\s\S]{0,400}?setShowRangeHint\(true\);\s*return;\s*\}/.test(modal), '点超距或未知距离技师必须被拦住,不能进详情');
assert.ok(/if \(rangeBlocked\) \{[\s\S]{0,400}?onRequireLocation\(\)/.test(modal), '距离未知被拦时必须顺手唤起墙面定位入口');
assert.ok(/therapist-card-out-of-range-hint-\$\{therapist\.id\}/.test(modal), '必须有"请选择您附近的技师"提示元素');
assert.ok(modal.includes('SERVICE_RADIUS_LOCATION_REQUIRED_MESSAGE'), '未知距离必须使用精确的确认位置提示');
assert.ok(modal.includes('SERVICE_RADIUS_TOO_FAR_MESSAGE'), '超距必须使用精确的附近技师提示');
assert.ok(modal.includes('therapist-out-of-range-tag') && modal.includes('Too far'), '超距卡片距离旁必须标注 Too far');
assert.ok(/rangeBlocked \? 'cursor-not-allowed bg-gray-200 text-gray-500'/.test(modal), '超距或距离未知的 Book 按钮必须置灰');

// 6) 定位死锁修复(老板 2026-07-20 拍板通过):拒绝浏览器定位的客人必须有墙面补位置入口
assert.ok(modal.includes('wall-location-entry'), '墙上必须有"确认我的位置"入口(定位死锁修复)');
assert.ok(modal.includes('wall-location-entry-toggle'), '定位入口必须有可点的按钮');
assert.ok(modal.includes('wall-location-picker'), '定位入口必须能展开 LocationPicker');
assert.ok(modal.includes('onRequireLocation'), '距离未知的卡片点击必须能唤起定位入口');
assert.ok(modal.includes('handleWallLocationChange'), '墙面选点必须写回 customerCoords 触发距离刷新');
console.log('[radius-deadlock-fix] wall_location_entry=present card_opens_picker_on_unknown_distance=true');

console.log('SERVICE_RADIUS_GATE_CHECK_PASS');
