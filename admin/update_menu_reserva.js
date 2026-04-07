const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/menu/page.tsx');
let code = fs.readFileSync(file, 'utf8');

// Add state for reserva
const stateInject = `  const [searchProductName, setSearchProductName] = useState<string | null>(null);

  // Reserva Welcome State
  const [reservaInfo, setReservaInfo] = useState<{ativa: boolean, nome: string} | null>(null);
  const [showReservaWelcome, setShowReservaWelcome] = useState(false);

  useEffect(() => {
    const fetchReserva = async () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('t');
        if (token) {
          const { data } = await supabase.from('mesas').select('reserva_ativa, reserva_nome').eq('token', token).single();
          if (data && data.reserva_ativa) {
             setReservaInfo({ ativa: data.reserva_ativa, nome: data.reserva_nome });
             setShowReservaWelcome(true);
          }
        }
      }
    };
    fetchReserva();
  }, [supabase]);
`;

code = code.replace('  const [searchProductName, setSearchProductName] = useState<string | null>(null);', stateInject);

// Add the modal HTML before the last </div>
const modalHTML = `
      {/* RESERVA WELCOME MODAL */}
      <AnimatePresence>
        {showReservaWelcome && reservaInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999999] flex items-center justify-center text-center"
            style={{ 
              backgroundColor: "rgba(0,0,0,0.9)",
              backdropFilter: "blur(24px)",
              padding: "20px"
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative bg-[#0a0a0a] border border-white/10 rounded-[36px] flex flex-col items-center justify-center shadow-[0_30px_60px_-15px_rgba(0,0,0,1)]"
              style={{
                width: "90%",
                maxWidth: "380px",
                minHeight: "400px",
                padding: "40px 30px",
              }}
            >
              <div style={{ marginBottom: "24px", display: "flex", justifySelf: "center", width: "100px", height: "100px", backgroundColor: "white", borderRadius: "20px", alignItems: "center", justifyContent: "center" }}>
                 <img src="/logo-black.png" alt="Seu Manel" style={{ width: "80%", height: "80%", objectFit: "contain" }} onError={(e) => e.currentTarget.style.display = 'none'} />
              </div>
              
              <h2 className="font-semibold text-white tracking-tight uppercase" style={{ fontSize: "28px", marginBottom: "8px", lineHeight: "1.1" }}>
                Bem vindo(a)
              </h2>
              <h2 className="font-semibold text-[#ff5e1e] tracking-tight uppercase" style={{ fontSize: "24px", marginBottom: "32px", lineHeight: "1.1" }}>
                {reservaInfo.nome}
              </h2>
              
              <p className="font-medium text-neutral-400" style={{ fontSize: "16px", lineHeight: "1.6", marginBottom: "0px", marginInline: "10px" }}>
                É uma honra receber você. Sinta-se em casa e aproveite nosso cardápio!
              </p>

              <button 
                onClick={() => setShowReservaWelcome(false)}
                className="w-full bg-[#ff5e1e] hover:bg-[#e54e15] text-white font-bold h-12 rounded-xl mt-8 transition-colors uppercase tracking-wider"
              >
                Acessar Cardápio
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
`;

code = code.replace('    </div>\n  );\n}', modalHTML);

fs.writeFileSync(file, code);
console.log('Menu script updated successfully!');
