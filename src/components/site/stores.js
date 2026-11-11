// 线下门店清单（2026-11-12 老板「官网里面 没有看到 门店下单啊？」「我们以后肯定不止一家店」→「先做起来」）。
// 门店总页 /stores、每家店一页 /stores/<slug>、首页「上门 / 到店」、菜单、网站地图都读这一份：新开一家店在这里加一条，网站各处自动多出来。
// ⚠ 只写真的：没定的地址、照片、营业时间就别填（空着页面就不显示那一行），不许放示意图、假地址。
// 现在一家都还没开（第一家店的城市、地址、开业时间、到店价格、预约方式等老板定），所以清单是空的，门店页显示「首家门店即将开业」。
// 以后要改成在后台填写（网页库加一张门店表 + 网页后台加一页），那一步要老板点头跑数据库改动，改好后这里换成读后台。
//
// 每家店一条，例子（字段都可以不填，除了 slug / name / city / status）：
// {
//   slug: 'makati-legazpi',            // 网址用：/stores/makati-legazpi，只用小写英文和横线，定了就别改
//   name: 'EasyGoSpa Makati',          // 店名（各语言都显示这个）
//   city: 'Metro Manila',              // 城市（门店页按城市分组；地名各语言都写英文，跟地图一致）
//   area: 'Legazpi Village, Makati',   // 区域
//   status: 'soon',                    // 'open' 营业中 / 'soon' 即将开业
//   opening: '2026-12',                // 即将开业时写大概哪个月（年-月），营业中可不填
//   address: '…',                      // 详细地址
//   mapUrl: 'https://maps.app.goo.gl/…', // 谷歌地图链接
//   hours: '10:00–02:00',              // 营业时间
//   phone: '+63 …',                    // 门店电话（不填就用公司电话）
//   photos: ['/global/stores/makati-1.webp'], // 门店真实照片（门头、房间），放在 public/global/stores/
//   booking: 'whatsapp',               // 预约方式：'whatsapp'（App 能约到店之前先用）/ 'app'（App 做好后）/ 'none'（先不开放）
//   samePrice: true,                   // 到店价格跟上门一样（不同就写 false，门店页会写「到店价格见店内价目」）
// }
export const STORES = []

export const storePath = (store) => `/stores/${store.slug}`

// 按城市分组，城市按第一次出现的顺序
export function storesByCity(stores = STORES) {
  const groups = []
  for (const store of stores) {
    let group = groups.find((g) => g.city === store.city)
    if (!group) groups.push((group = { city: store.city, stores: [] }))
    group.stores.push(store)
  }
  return groups
}
