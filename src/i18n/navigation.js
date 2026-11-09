import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// 站内链接一律用这里的 Link / useRouter / usePathname：会自动带上当前语言
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
