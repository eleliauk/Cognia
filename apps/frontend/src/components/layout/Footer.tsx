export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background py-4 px-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>© {currentYear} 科研实习匹配系统. 保留所有权利.</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-foreground transition-colors">
            帮助中心
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            隐私政策
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            使用条款
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
