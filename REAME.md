# Cyclefi

```bash
npm install
```

Generate prisma client

```bash
npx prisma generate
```

add models in schema.prisma. After add one model, don't forget

```bash
npx prisma migrate dev

#or
npx prisma migrate dev --create-only  #Only create sql file but will not be executed
```
