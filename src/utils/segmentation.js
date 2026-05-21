export const getNeverOrderedUsers = (registeredUsers, orders) => {
  const customerPhones = new Set(
    orders
      .map(o => o.deliveryAddress?.phone || o.address?.phone)
      .filter(Boolean)
  );

  return registeredUsers
    .filter(u => !customerPhones.has(u.phone))
    .map(u => ({
      ...u,
      daysRegistered: Math.floor(
        (Date.now() - new Date(u.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)
      )
    }))
    .sort((a, b) => b.daysRegistered - a.daysRegistered);
};

export const getInactiveUsers = (orders, registeredUsers) => {
  const today = new Date();
  const customerMap = {};

  // Build customer lookup
  orders.forEach(order => {
    const phone = order.deliveryAddress?.phone || order.address?.phone;
    if (!phone) return;

    const orderDate = new Date(order.placedAt);
    if (!customerMap[phone] || orderDate > customerMap[phone].lastOrderDate) {
      customerMap[phone] = { lastOrderDate: orderDate };
    }
  });

  // Add customer names and UIDs from registeredUsers
  registeredUsers.forEach(user => {
    if (customerMap[user.phone]) {
      customerMap[user.phone].name = user.name;
      customerMap[user.phone].uid = user.uid;
    }
  });

  // Filter for >= 30 days inactive
  return Object.entries(customerMap)
    .filter(([, data]) => {
      const daysInactive = (today - data.lastOrderDate) / (1000 * 60 * 60 * 24);
      return daysInactive >= 30;
    })
    .map(([phone, data]) => ({
      phone,
      name: data.name || 'Unknown',
      uid: data.uid || null,
      lastOrderDate: data.lastOrderDate,
      daysInactive: Math.floor((today - data.lastOrderDate) / (1000 * 60 * 60 * 24))
    }))
    .sort((a, b) => b.daysInactive - a.daysInactive);
};

export const getCartAbandonedUsers = () => {
  // Placeholder - would need cart tracking in Firestore
  return [];
};

export const getSegmentInfo = (segment) => {
  const info = {
    never_ordered: {
      icon: '🎁',
      title: 'Never Ordered',
      description: 'First-time buyers',
      color: 'purple'
    },
    inactive: {
      icon: '😴',
      title: 'Inactive',
      description: '30+ days no order',
      color: 'yellow'
    },
    cart_abandoned: {
      icon: '🛒',
      title: 'Cart Abandoned',
      description: 'Items in cart, no checkout',
      color: 'red'
    }
  };
  return info[segment] || info.never_ordered;
};
