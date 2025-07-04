import React from 'react';
import Badge from '@/components/atoms/Badge';

const OrderStatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { variant: 'warning', text: 'Pending' };
      case 'confirmed':
        return { variant: 'info', text: 'Confirmed' };
      case 'packed':
        return { variant: 'primary', text: 'Packed' };
      case 'shipped':
        return { variant: 'secondary', text: 'Shipped' };
      case 'delivered':
        return { variant: 'success', text: 'Delivered' };
      case 'cancelled':
        return { variant: 'danger', text: 'Cancelled' };
      default:
        return { variant: 'default', text: status || 'Unknown' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant={config.variant} size="medium">
      {config.text}
    </Badge>
  );
};

export default OrderStatusBadge;