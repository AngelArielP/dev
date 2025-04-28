#!/bin/bash

echo "🚀 Iniciando instalación de dependencias y arranque de servicios Node.js..."

# Verificar si pm2 está instalado
if ! command -v pm2 &> /dev/null
then
    echo "🔧 pm2 no está instalado. Instalándolo ahora..."
    npm install -g pm2
else
    echo "✅ pm2 ya está instalado."
fi

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

# Iniciar los dos servicios con nombres personalizados
echo "🚀 Levantando servicio APIOT..."
pm2 start ./APIOT/server.js --name APIOT

echo "🚀 Levantando servicio SERVERIOT..."
pm2 start ./ServerIoT/main.js --name SERVERIOT

# Guardar la configuración para reinicio automático
echo "💾 Guardando estado de pm2..."
pm2 save

# Configurar pm2 para inicio automático en reinicio del servidor
echo "🛠️ Configurando pm2 para inicio automático..."
pm2 startup

echo "✅ Todo listo. Servicios corriendo en segundo plano."
pm2 ls
