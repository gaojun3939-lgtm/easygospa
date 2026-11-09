import { notFound } from 'next/navigation';

// 语言下面没有这一页：交给 [locale]/not-found.jsx，用当前语言显示找不到
export default function CatchAll() {
  notFound();
}
