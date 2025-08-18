/**
 * 🆕 NOVO: Utilitário para formatação de números de telefone
 * Corrige automaticamente números brasileiros para formato internacional (+55)
 * Preserva números internacionais já corretos
 */

export class PhoneFormatterUtil {
  /**
   * Formata número de telefone para formato internacional
   * Detecta automaticamente números brasileiros e adiciona +55
   */
  static formatPhoneNumber(phone: string): string {
    if (!phone) return phone;
    
    // Remover espaços, parênteses, hífens e outros caracteres
    let cleanPhone = phone.replace(/[\s\(\)\-\s]/g, '');
    
    // Se já tem + no início, preservar
    const hasPlus = cleanPhone.startsWith('+');
    if (hasPlus) {
      cleanPhone = cleanPhone.substring(1);
    }
    
    // DDDs brasileiros conhecidos (todos os 90 DDDs)
    const brazilianDDDs = [
      '11', '12', '13', '14', '15', '16', '17', '18', '19',
      '21', '22', '23', '24', '25', '26', '27', '28', '29',
      '31', '32', '33', '34', '35', '36', '37', '38', '39',
      '41', '42', '43', '44', '45', '46', '47', '48', '49',
      '51', '52', '53', '54', '55', '56', '57', '58', '59',
      '61', '62', '63', '64', '65', '66', '67', '68', '69',
      '71', '72', '73', '74', '75', '76', '77', '78', '79',
      '81', '82', '83', '84', '85', '86', '87', '88', '89',
      '91', '92', '93', '94', '95', '96', '97', '98', '99'
    ];
    
    // 🔍 DETECTAR SE É NÚMERO BRASILEIRO
    if (cleanPhone.length === 11) {
      const ddd = cleanPhone.substring(0, 2);
      
      // 🇧🇷 SE É BRASIL: Adicionar +55 automaticamente
      if (brazilianDDDs.includes(ddd)) {
        // Se não tem 55 no início, adicionar
        if (!cleanPhone.startsWith('55')) {
          cleanPhone = '55' + cleanPhone;
        }
      }
    }
    
    // Adicionar + no início
    return '+' + cleanPhone;
  }
  
  /**
   * Verifica se um número é brasileiro
   */
  static isBrazilianNumber(phone: string): boolean {
    if (!phone) return false;
    
    const cleanPhone = phone.replace(/[\s\(\)\-\s]/g, '');
    const brazilianDDDs = [
      '11', '12', '13', '14', '15', '16', '17', '18', '19',
      '21', '22', '23', '24', '25', '26', '27', '28', '29',
      '31', '32', '33', '34', '35', '36', '37', '38', '39',
      '41', '42', '43', '44', '45', '46', '47', '48', '49',
      '51', '52', '53', '54', '55', '56', '57', '58', '59',
      '61', '62', '63', '64', '65', '66', '67', '68', '69',
      '71', '72', '73', '74', '75', '76', '77', '78', '79',
      '81', '82', '83', '84', '85', '86', '87', '88', '89',
      '91', '92', '93', '94', '95', '96', '97', '98', '99'
    ];
    
    if (cleanPhone.length === 11) {
      const ddd = cleanPhone.substring(0, 2);
      return brazilianDDDs.includes(ddd);
    }
    
    return false;
  }
  
  /**
   * Valida se o número está no formato correto para Twilio
   */
  static isValidForTwilio(phone: string): boolean {
    if (!phone) return false;
    
    const formatted = this.formatPhoneNumber(phone);
    
    // Deve ter pelo menos 10 dígitos (código do país + número)
    return formatted.length >= 12 && formatted.startsWith('+');
  }
}
