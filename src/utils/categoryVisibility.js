const normalizeCategoryValue = (value = '') =>
  (value ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const asKey = (value) => normalizeCategoryValue(value).replace(/\s+/g, '-');

const HIDDEN_PUBLIC_CATEGORY_KEYS = new Set([
  'ai',
  'ai-automation',
  'automacao-com-ia',
  'automacao-ia',
  'ia',
  'ia-automacao',
  'ia-e-automacao',
  'inteligencia-artificial',
  'inteligencia-artificial-e-automacao',
  'prompt-engineering',
  'robot',
]);

export const isHiddenPublicCategory = (category) => {
  if (!category) return false;

  const values = [
    category.slug,
    category.name,
    category.icon,
    category.iconKey,
    category.categorySlug,
    category.categoryName,
    category.subcategorySlug,
    category.subcategoryName,
  ];

  return values.some((value) => HIDDEN_PUBLIC_CATEGORY_KEYS.has(asKey(value)));
};

export const filterPublicCategories = (categories = []) =>
  (Array.isArray(categories) ? categories : []).filter((category) => !isHiddenPublicCategory(category));

export const filterPublicServices = (services = []) =>
  (Array.isArray(services) ? services : []).filter((service) => {
    const categoryPayloads = [
      service?.category,
      {
        categorySlug: service?.categorySlug,
        categoryName: service?.categoryName,
        subcategorySlug: service?.subcategorySlug,
        subcategoryName: service?.subcategoryName,
      },
    ];

    return categoryPayloads.every((categoryPayload) => !isHiddenPublicCategory(categoryPayload));
  });
