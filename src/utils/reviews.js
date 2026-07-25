export const getReviewAuthor = (review = {}) => {
  const person = review.client || review.author || review.user || {};
  const firstName = person.firstName?.trim() || '';
  const lastName = person.lastName?.trim() || '';
  const username = person.username?.trim() || '';
  const name = `${firstName} ${lastName}`.trim() || username || 'Cliente';
  const initials = [firstName[0], lastName[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || username.slice(0, 2).toUpperCase() || 'CL';

  return {
    avatarUrl: person.avatarUrl || person.profile?.avatarUrl || null,
    initials,
    name,
  };
};
