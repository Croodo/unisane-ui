
import React from 'react';
import { Icon } from '../ui/Icon';

export const Icons = {
  Dashboard: (props: any) => <Icon symbol="dashboard" {...props} />,
  Inventory: (props: any) => <Icon symbol="inventory_2" {...props} />,
  Sales: (props: any) => <Icon symbol="receipt_long" {...props} />,
  Purchases: (props: any) => <Icon symbol="shopping_bag" {...props} />,
  Parties: (props: any) => <Icon symbol="group" {...props} />,
  Reports: (props: any) => <Icon symbol="analytics" {...props} />,
  Settings: (props: any) => <Icon symbol="settings" {...props} />,
  Add: (props: any) => <Icon symbol="add" {...props} />,
  Filter: (props: any) => <Icon symbol="filter_list" {...props} />,
  Search: (props: any) => <Icon symbol="search" {...props} />,
  More: (props: any) => <Icon symbol="more_vert" {...props} />,
  TrendUp: (props: any) => <Icon symbol="trending_up" {...props} />,
  TrendDown: (props: any) => <Icon symbol="trending_down" {...props} />,
  Warehouse: (props: any) => <Icon symbol="warehouse" {...props} />,
  Money: (props: any) => <Icon symbol="payments" {...props} />,
  Check: (props: any) => <Icon symbol="check_circle" {...props} />,
  Warning: (props: any) => <Icon symbol="warning" {...props} />,
  Menu: (props: any) => <Icon symbol="menu" {...props} />,
  Terminal: (props: any) => <Icon symbol="terminal" {...props} />,
  History: (props: any) => <Icon symbol="history" {...props} />,
  Adjust: (props: any) => <Icon symbol="tune" {...props} />,
  Notifications: (props: any) => <Icon symbol="notifications" {...props} />,
  Edit: (props: any) => <Icon symbol="edit" {...props} />,
  Delete: (props: any) => <Icon symbol="delete" {...props} />,
  File: (props: any) => <Icon symbol="description" {...props} />,
  // Added missing Refresh icon for system sync operations
  Refresh: (props: any) => <Icon symbol="refresh" {...props} />,
};
