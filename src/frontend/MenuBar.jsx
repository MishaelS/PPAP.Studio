import { useEffect, useRef, useState } from 'react';
import { cx } from '../backend/constants.js';
import Icon from './Icon.jsx';

// menus: [{ id, label, items: [{ id, label, icon?, checked?, disabled?, onSelect } | { separator: true } | { heading, icon? }] }]
export default function MenuBar({ menus }) {
  const [open, setOpen] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(null);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(null);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const select = (item) => {
    if (item.disabled) return;
    setOpen(null);
    item.onSelect();
  };

  return (
    <nav className="menubar" ref={ref}>
      {menus.map((menu) => (
        <div key={menu.id} className="menu">
          <button
            className={cx('menu-title', open === menu.id && 'open')}
            aria-haspopup="menu"
            aria-expanded={open === menu.id}
            onClick={() => setOpen(open === menu.id ? null : menu.id)}
            onPointerEnter={() => open && setOpen(menu.id)}
          >
            {menu.label}
          </button>
          {open === menu.id && (
            <div className="menu-list" role="menu">
              {menu.items.map((item, i) => {
                if (item.separator) return <div key={`sep-${i}`} className="menu-separator" role="separator" />;
                if (item.heading) {
                  return (
                    <div key={`head-${i}`} className="menu-heading">
                      {item.icon && <Icon name={item.icon} />}{item.heading}
                    </div>
                  );
                }
                return (
                  <button
                    key={item.id}
                    className="menu-item"
                    role={item.checked === undefined ? 'menuitem' : 'menuitemradio'}
                    aria-checked={item.checked}
                    disabled={item.disabled}
                    onClick={() => select(item)}
                  >
                    <span className="menu-icon">
                      {item.checked ? <Icon name="check" /> : item.icon && <Icon name={item.icon} />}
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
