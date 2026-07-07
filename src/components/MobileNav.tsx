import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

const LINKS = [
  { href: '/', label: 'About' },
  { href: '/portfolio/', label: 'Portfolio' },
  { href: '/resume/', label: 'Resumé' },
];

export default function MobileNav() {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="mobile-nav-trigger" aria-label="Menu">
          Menu
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="mobile-nav-content"
          align="end"
          sideOffset={8}
        >
          {LINKS.map(({ href, label }) => (
            <DropdownMenu.Item key={href} asChild>
              <a className="mobile-nav-item" href={href}>
                {label}
              </a>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
