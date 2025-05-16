/**
 * Role-based access control utility functions
 */

// Define permissions for different roles
const ROLE_PERMISSIONS = {
  administrator: ['all'],
  admin: ['all'],      // Adding 'admin' role with full access
  manager: ['all'],
  receptionist: ['rooms', 'checkIn', 'checkOut', 'customerInfo', 'other'],
  accountant: ['accounting', 'financial-reports', 'other'], // Accountant has access only to accounting, financial reports and other pages
  // Add more roles as needed
};

// Define restricted pages for roles that need specific access control
const RESTRICTED_PAGES = {
  receptionist: ['accounting', 'financial-reports', 'manage-staff', 'manage-rooms'],
  accountant: ['customerInfo', 'checkIn', 'checkOut', 'rooms', 'manage-staff', 'manage-rooms']
};

// Map page routes to tab names for consistency in access control
const PAGE_ROUTE_MAPPING = {
  'rooms': 'rooms',
  'manage-rooms': 'rooms',
  'customerInfo': 'customerInfo',
  'checkIn': 'checkIn',
  'checkOut': 'checkOut'
};

/**
 * Check if a user has permission to access a specific page
 * @param {Object} user - The user object from auth context
 * @param {String} page - The page route to check access for
 * @returns {Boolean} - Whether the user has access to the page
 */
export const hasPageAccess = (user, page) => {
  if (!user || !user.roles || user.roles.length === 0) {
    console.log('No user or roles found:', user);
    return false;
  }

  console.log('Checking access for user:', user);
  console.log('Checking access to page:', page);
  console.log('User roles:', user.roles);

  // Check for admin/administrator role first (case insensitive check)
  const userRolesLowercase = user.roles.map(role => role.toLowerCase());
  if (userRolesLowercase.includes('admin') || userRolesLowercase.includes('administrator')) {
    console.log('User has admin/administrator role, granting access');
    return true;
  }

  // Check if any of the user's roles has 'all' permission
  const hasFullAccess = userRolesLowercase.some(role => {
    const permissions = ROLE_PERMISSIONS[role];
    return permissions && permissions.includes('all');
  });

  if (hasFullAccess) {
    console.log('User has a role with full access, granting access');
    return true;
  }

  // Map the page route to its standard name if necessary
  const standardPageName = PAGE_ROUTE_MAPPING[page] || page;
  
  // Check if the page is restricted for any of the user's roles
  const isRestricted = userRolesLowercase.some(role => {
    const restrictedPages = RESTRICTED_PAGES[role];
    return restrictedPages && (restrictedPages.includes(page) || restrictedPages.includes(standardPageName));
  });

  // If explicitly restricted, deny access
  if (isRestricted) {
    console.log('Page is restricted for user role, denying access');
    return false;
  }

  // If not explicitly restricted, check if any role has explicit permission
  const hasPermission = userRolesLowercase.some(role => {
    const permissions = ROLE_PERMISSIONS[role];
    return permissions && (permissions.includes(page) || permissions.includes(standardPageName) || permissions.includes('all'));
  });

  console.log('Has explicit permission:', hasPermission);
  return hasPermission;
};

export default {
  hasPageAccess
}; 