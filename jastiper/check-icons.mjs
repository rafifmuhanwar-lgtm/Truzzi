import * as Lucide from 'lucide-react';

const icons = [
  'ChatBubble', 'CheckCircle2', 'ImageIcon', 'CheckCheck', 'Headset',
  'Navigation', 'MapPin', 'RefreshCw', 'LifeBuoy', 'Settings',
  'Camera', 'Send', 'Info', 'ShoppingBag', 'Tag', 'X', 'UserCog',
  'Bell', 'History', 'LogOut', 'MessageCircle', 'ClipboardList',
  'ArrowLeft', 'ChevronDown', 'Mail', 'Wallet', 'Package', 'TrendingUp',
  'Target', 'ShieldCheck', 'Rocket', 'Home', 'Person', 'CheckCircle',
  'Check', 'Image', 'MessageSquare', 'Navigation2', 'RefreshCcw',
  'Settings2', 'Assignment'
];

icons.forEach(name => {
  console.log(`${name}:`, name in Lucide);
});