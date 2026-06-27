# Gym Tracker

Aplicacao web simples para acompanhar treinos de academia.

## Recursos da primeira versao

- Funciona offline.
- Publicavel no GitHub Pages.
- Salva treinos e pesos no LocalStorage.
- Mostra o treino atual com dias A, B e C.
- Lista treinos antigos em modo somente leitura.
- Registra peso por exercicio.
- Exibe ultimo peso e historico.
- Mostra tempo de descanso e cronometro simples por exercicio.

## Como usar

Abra o arquivo `index.html` no navegador ou publique o repositorio no GitHub Pages.

- `index.html`: treino atual.
- `old-workouts.html`: treinos antigos em modo somente leitura.

## Backup

Na pagina principal:

- `Exportar`: gera um backup completo com todos os treinos salvos no navegador.
- `Exportar atual como antigo`: gera apenas o treino atual com `active: false`, pronto para copiar para `OLD_WORKOUTS` no futuro.
- `Importar`: restaura um backup completo exportado anteriormente.

## IDs de exercicios

- `id`: identifica a ocorrencia do exercicio dentro de um treino/dia.
- `exerciseId`: identifica o exercicio real e deve ser usado para PR e comparacoes entre treinos.
- `data/exerciseCatalog.js`: catalogo central dos `exerciseId` e aliases de nomes antigos.
