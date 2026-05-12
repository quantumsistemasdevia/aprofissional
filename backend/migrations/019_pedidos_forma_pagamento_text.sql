-- Aumenta capacidade de forma_pagamento para suportar JSON com múltiplas formas
ALTER TABLE pedidos ALTER COLUMN forma_pagamento TYPE TEXT;
