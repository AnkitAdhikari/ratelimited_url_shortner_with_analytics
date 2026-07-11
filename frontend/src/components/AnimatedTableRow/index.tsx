import { useLayoutEffect, useRef } from 'react';

// FLIP row for antd Table (components.body.row): when sorting reorders rows,
// each row animates from its previous offset instead of snapping
export default function AnimatedTableRow(props: React.HTMLAttributes<HTMLTableRowElement>) {
  const ref = useRef<HTMLTableRowElement>(null);
  const lastOffsetTop = useRef<number | null>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (node === null) return;

    const { offsetTop } = node;
    const previous = lastOffsetTop.current;
    lastOffsetTop.current = offsetTop;

    if (previous === null || previous === offsetTop) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    node.animate(
      [{ transform: `translateY(${previous - offsetTop}px)` }, { transform: 'translateY(0)' }],
      // gentle ease-out: fast start, long soft settle
      { duration: 550, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );
  });

  return <tr ref={ref} {...props} />;
}
