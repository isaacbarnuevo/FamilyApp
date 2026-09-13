import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary ha capturado un error en FamilyApp:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white/10 border border-white/20 rounded-3xl p-6 text-center space-y-4 backdrop-blur-xl shadow-2xl">
            <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/40 rounded-2xl flex items-center justify-center mx-auto text-3xl">
              🏡
            </div>
            <h2 className="text-xl font-bold text-white">Recuperando FamilyApp</h2>
            <p className="text-xs text-slate-300">
              Se ha detectado un pequeño conflicto al cargar los datos en tu dispositivo. Puedes recargar la app para entrar normalmente:
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('family_app_usuario_activo');
                  } catch (e) {}
                  window.location.reload();
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-md"
              >
                🔄 Recargar Aplicación
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.clear();
                  } catch (e) {}
                  window.location.reload();
                }}
                className="w-full bg-white/10 hover:bg-white/20 text-slate-300 font-medium py-2 px-4 rounded-xl text-xs transition"
              >
                Limpiar datos guardados y reiniciar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
