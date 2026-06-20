import { GraduationCap, Mail, MapPin, Phone } from 'lucide-react';

export const PublicFooter = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="max-w-6xl mx-auto px-4 py-14 grid gap-10 md:grid-cols-4">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">GPGC Portal</span>
          </div>
          <p className="text-sm opacity-80 leading-relaxed">
            A smart learning companion for BS-level students — quizzes, key notes, past papers, AI tutor and more, all in one place.
          </p>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
            <li><a href="#why" className="hover:text-primary transition-colors">Why Choose Us</a></li>
            <li><a href="#about" className="hover:text-primary transition-colors">About</a></li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h4 className="font-semibold mb-4">Resources</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li>Key Notes</li>
            <li>Past Papers</li>
            <li>AI Tutor (Mesh Chat)</li>
            <li>Discussion Forum</li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-semibold mb-4">Contact</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0" /> Swabi, KPK, Pakistan</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> support@gpgcswabi.app</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> +92 300 0000000</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-secondary-foreground/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs opacity-80">
          <span>© {new Date().getFullYear()} GPGC Portal. All rights reserved.</span>
          <span>Developed By: <span className="font-semibold text-primary">MYNT</span></span>
        </div>
      </div>
    </footer>
  );
};
