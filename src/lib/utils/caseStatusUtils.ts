/**
 * Case Status Management Utilities
 * Handles validation and permission checking for case status changes
 */

export const CASE_STATUSES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in progress',
  TO_BE_REVIEWED_BY_DENTIST: 'to be reviewed by dentist',
  TO_BE_DELIVER: 'to be deliver',
  DELIVERED: 'delivered'
} as const;

export type CaseStatus = (typeof CASE_STATUSES)[keyof typeof CASE_STATUSES];

/**
 * Role-based permissions for status changes
 */
export const ROLE_PERMISSIONS: Record<string, CaseStatus[]> = {
  dentist: [CASE_STATUSES.TO_BE_DELIVER, CASE_STATUSES.PENDING],
  staff: [CASE_STATUSES.PENDING, CASE_STATUSES.IN_PROGRESS, CASE_STATUSES.TO_BE_REVIEWED_BY_DENTIST],
  admin: [
    CASE_STATUSES.PENDING,
    CASE_STATUSES.IN_PROGRESS,
    CASE_STATUSES.TO_BE_REVIEWED_BY_DENTIST,
    CASE_STATUSES.TO_BE_DELIVER,
    CASE_STATUSES.DELIVERED
  ]
};

/**
 * Get the list of valid statuses for a given user role
 * @param userRole The user's role
 * @returns Array of statuses the user can change to
 */
export function getAvailableStatusesForRole(userRole: string): CaseStatus[] {
  return ROLE_PERMISSIONS[userRole.toLowerCase()] || [];
}

/**
 * Check if a user with a given role can change to a specific status
 * @param userRole The user's role
 * @param targetStatus The status being changed to
 * @returns True if the user can change to that status
 */
export function canChangeToStatus(userRole: string, targetStatus: string): boolean {
  const allowedStatuses = getAvailableStatusesForRole(userRole);
  return allowedStatuses.includes(targetStatus as CaseStatus);
}

/**
 * Get status display information
 * @param status The case status
 * @returns Object with label and UI configuration
 */
export function getStatusConfig(status: string): {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  description: string;
} {
  const configs: Record<
    string,
    { label: string; color: string; bgColor: string; icon: string; description: string }
  > = {
    [CASE_STATUSES.PENDING]: {
      label: 'Pending',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      icon: '⏳',
      description: 'Case is pending - awaiting review or action'
    },
    [CASE_STATUSES.IN_PROGRESS]: {
      label: 'In Progress',
      color: 'text-purple-700',
      bgColor: 'bg-purple-100',
      icon: '⚙️',
      description: 'Case is currently being worked on by technicians'
    },
    [CASE_STATUSES.TO_BE_REVIEWED_BY_DENTIST]: {
      label: 'To Be Reviewed By Dentist',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      icon: '👨‍⚕️',
      description: 'Case awaiting dentist review before delivery'
    },
    [CASE_STATUSES.TO_BE_DELIVER]: {
      label: 'To Be Deliver',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      icon: '✓',
      description: 'Case is ready for delivery/action'
    },
    [CASE_STATUSES.DELIVERED]: {
      label: 'Delivered',
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-100',
      icon: '📦',
      description: 'Case has been physically delivered to the clinic'
    }
  };

  return (
    configs[status] || {
      label: status,
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      icon: '?',
      description: 'Unknown status'
    }
  );
}

/**
 * Check if a case can be taken out for action (IN page)
 * Cases can only be actioned if status is "pending"
 * @param caseStatus The current case status
 * @returns True if the case can be actioned
 */
export function canActionCase(caseStatus: string): boolean {
  return caseStatus === CASE_STATUSES.PENDING;
}

/**
 * Get status change workflow timeline
 * Shows typical status progression
 * @returns Array of status transitions
 */
export function getStatusWorkflow(): Array<{
  status: CaseStatus;
  label: string;
  nextStages: CaseStatus[];
}> {
  return [
    {
      status: CASE_STATUSES.PENDING,
      label: 'Pending',
      nextStages: [CASE_STATUSES.IN_PROGRESS, CASE_STATUSES.TO_BE_REVIEWED_BY_DENTIST]
    },
    {
      status: CASE_STATUSES.IN_PROGRESS,
      label: 'In Progress',
      nextStages: [CASE_STATUSES.TO_BE_REVIEWED_BY_DENTIST]
    },
    {
      status: CASE_STATUSES.TO_BE_REVIEWED_BY_DENTIST,
      label: 'To Be Reviewed By Dentist',
      nextStages: [CASE_STATUSES.TO_BE_DELIVER]
    },
    {
      status: CASE_STATUSES.TO_BE_DELIVER,
      label: 'To Be Deliver',
      nextStages: [CASE_STATUSES.DELIVERED]
    },
    {
      status: CASE_STATUSES.DELIVERED,
      label: 'Delivered',
      nextStages: []
    }
  ];
}
