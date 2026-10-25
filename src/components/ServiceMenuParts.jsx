import BrandMark from './BrandMark';

// 服务卡照片按后台项目编号对应(编号见后台「服务项目」,不是名字,改名不影响)。
// Thai Body 沿用原来泰式干按那张(同是不用油的拉伸),Shiatsu 沿用原来按肩那张(穿衣指压)。
const SERVICE_PREVIEW_IMAGES = {
  'swedish-massage': '/images/brand/service-previews/service-swedish-preview.webp',
  'deep-tissue': '/images/brand/service-previews/service-deep-tissue-preview.webp',
  'hot-stone-massage': '/images/brand/service-previews/service-hot-stone-preview.webp',
  'thai-body-massage': '/images/brand/service-previews/service-thai-dry-preview.webp',
  'shiatsu-body-massage-without-oil': '/images/brand/service-previews/service-head-shoulder-preview.webp'
};

export const formatPeso = value => `₱${Number(value || 0).toLocaleString('en-US')}`;

// 卡片顶上的照片。后台项目还没配照片(比如精油按摩、以后新加的)→ 米色底 + 品牌莲花,不拿别的项目照片顶。
export function ServiceCardImage({ service }) {
  const src = SERVICE_PREVIEW_IMAGES[service.id];
  if (!src) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#F8F2EC]">
        <BrandMark size={120} tone="brand" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={`${service.name} - home massage in Metro Manila by EasyGo Spa`}
      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
      loading="lazy"
      decoding="async"
    />
  );
}

// 每档时长一格(后台开几档就几格),样式跟 /pricing 页原来的价格格子一样。
export function ServicePrices({ options = [], className = '' }) {
  return (
    <div className={`grid gap-2 ${className}`} style={{ gridTemplateColumns: `repeat(${Math.max(options.length, 1)}, minmax(0, 1fr))` }}>
      {options.map(option => (
        <div className="rounded-xl bg-[#FDFCF9] px-3 py-2 text-center" key={option.optionId || option.durationMinutes}>
          <p className="text-xs text-gray-500 m-0">{option.durationMinutes} min</p>
          <p className="text-lg font-bold text-[#0F0F0F] m-0">{formatPeso(option.price)}</p>
        </div>
      ))}
    </div>
  );
}
