#!/bin/bash

echo "🚀 Iniciando instalación de dependencias y servicios..."

# Verificar si pm2 está instalado
if ! command -v pm2 &> /dev/null
then
    echo "🔧 pm2 no está instalado. Instalándolo ahora..."
    npm install -g pm2
else
    echo "✅ pm2 ya está instalado."
fi

# Borrar procesos anteriores
echo "🧹 Eliminando procesos anteriores..."
pm2 delete all

# Instalar dependencias en APIOT
echo "📦 Instalando dependencias en APIOT..."
cd ./APIOT
npm install
cd ..

# Instalar dependencias en ServerIoT
echo "📦 Instalando dependencias en ServerIoT..."
cd ./ServerIoT
npm install
cd ..

pm2 flush

# Levantar todo con ecosystem
echo "🚀 Levantando servicios con ecosystem.config.js..."
pm2 start ecosystem.config.js

# Guardar configuración
echo "💾 Guardando estado de pm2..."
pm2 save

# Configurar pm2 para inicio automático
echo "🛠️ Configurando pm2 para arranque automático..."
pm2 startup

echo "✅ Todos los servicios Node.js corriendo en segundo plano."
pm2 ls
