// 里面各页的页头：小字、大标题、一段说明，全站同一个样子
export default function PageHead({ eyebrow, title, children }) {
  return (
    <header className="ga-page-head ga-wrap">
      {eyebrow ? <p className="ga-eyebrow">{eyebrow}</p> : null}
      <h1 className="ga-page-title">{title}</h1>
      {children ? <div className="ga-page-lead">{children}</div> : null}
    </header>
  )
}
