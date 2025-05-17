export const formatCurrency = (amount, locale = 'fr-FR', currency = 'MAD') => {
  if (amount === null || amount === undefined) return '0,00 MAD';
  
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    });
    
    return formatter.format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${amount} MAD`;
  }
};

export const formatNumber = (number, locale = 'fr-FR') => {
  if (number === null || number === undefined) return '0';
  
  try {
    return new Intl.NumberFormat(locale).format(number);
  } catch (error) {
    console.error('Error formatting number:', error);
    return number.toString();
  }
};
