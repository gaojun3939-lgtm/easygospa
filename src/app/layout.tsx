// 真正的外框在 [locale]/layout.tsx（每种语言一套）。这一层只是让 Next 认得最外面的找不到页面。
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
