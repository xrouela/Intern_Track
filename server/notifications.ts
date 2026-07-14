export type RequestNotificationContext = {
  requestType: 'schedule' | 'leave';
  action: 'submitted' | 'approved' | 'rejected' | 'pending';
  requesterName?: string;
  reviewerName?: string;
};

function formatRequestLabel(requestType: 'schedule' | 'leave') {
  return requestType === 'leave' ? 'Leave request' : 'Schedule change request';
}

export function buildRequestNotification(context: RequestNotificationContext) {
  const requestLabel = formatRequestLabel(context.requestType);

  if (context.action === 'submitted') {
    return {
      title: `New ${requestLabel.toLowerCase()} from ${context.requesterName || 'a user'}`,
      message: `${context.requesterName || 'A user'} submitted a ${requestLabel.toLowerCase()} for review.`,
    };
  }

  if (context.action === 'approved') {
    return {
      title: `${requestLabel} approved`,
      message: `${context.reviewerName || 'A reviewer'} approved your ${requestLabel.toLowerCase()}.`,
    };
  }

  if (context.action === 'rejected') {
    return {
      title: `${requestLabel} rejected`,
      message: `${context.reviewerName || 'A reviewer'} rejected your ${requestLabel.toLowerCase()}.`,
    };
  }

  return {
    title: `New ${requestLabel.toLowerCase()} pending review`,
    message: `${context.requesterName || 'A user'} has a ${requestLabel.toLowerCase()} awaiting review.`,
  };
}
