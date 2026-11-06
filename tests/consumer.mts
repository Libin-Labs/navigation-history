import { createHistory } from '@lp-labs/navigation-history';

const history = createHistory({ location: '/', state: { section: 'home' } });
history.push('/settings', { tab: 2 });
if (history.back().location !== '/') throw new Error('Back failed');
if (history.forward().location !== '/settings') throw new Error('Forward failed');

// @ts-expect-error invalid public API input must be rejected
createHistory({ location: '/', state: () => 1 });
