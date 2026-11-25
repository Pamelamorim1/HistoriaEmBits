Passo a passo (com o servidor no PC + Expo Go)
Ative o Ponto de Acesso (Hotspot) no celular.
Conecte o PC e os celulares dos outros jogadores nesse Wi-Fi do hotspot.
No PC, descubra o IP dele nessa rede:
powershell
ipconfig
Procure o Endereço IPv4 da interface Wi-Fi (em hotspot de celular costuma ser algo como 192.168.43.xxx ou 172.20.10.xxx).
No PC, inicie o servidor e o Expo:
Terminal 1:
powershell
npm run server
Terminal 2:
powershell
npx expo start
(Na mesma rede do hotspot nem precisa de --tunnel, mas se usar --tunnel também funciona.)
Nos celulares (incluindo o que está roteando):
Abra o app no Expo Go.
Toque em "Configurar IP do Servidor" na tela inicial e coloque o IPv4 do PC com a porta 3000 (ex.: http://192.168.43.50:3000).
(Obs.: coloque o IP do PC, porque é nele que o npm run server está rodando — o 192.168.43.1 é o gateway do celular, que só serviria como host no APK nativo compilado.)
Joguem: um jogador cria a sala (SALA-01) e os outros entram com o código.
Se não conectar no servidor do PC

Quando você conecta o Windows em um hotspot novo, ele costuma definir a rede como Pública e o Firewall bloqueia a porta 3000. Se der erro de conexão no app:

Nas configurações de Wi-Fi do Windows, mude o perfil da rede do hotspot para Privada, ou libere o Node.js no Firewall do Windows.