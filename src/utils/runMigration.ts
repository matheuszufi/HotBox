import { migrateRealMenuToFirebase } from './migrateProducts';

// Executar a migração
migrateRealMenuToFirebase()
  .then((result) => {
    console.log('Migração concluída:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro na migração:', error);
    process.exit(1);
  });