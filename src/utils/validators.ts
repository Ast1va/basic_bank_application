/**
 * Boş alan kontrolü
 */
export const isNotEmpty = (value: string): boolean => {
    return value.trim().length > 0;
  };
  
  /**
   * Pozitif sayı kontrolü (örneğin: aylık gelir gibi alanlar için)
   */
  export const isPositiveNumber = (value: string | number): boolean => {
    return Number(value) > 0;
  };
  
  /**
   * Geçerli e-posta adresi kontrolü
   */
  export const isValidEmail = (email: string): boolean => {
    const regex = /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/;
    return regex.test(email);
  };
  
  /**
   * Şifre kontrolü: En az 6 karakter
   */
  export const isValidPassword = (value: string): boolean => {
    return value.length >= 6;
  };
  