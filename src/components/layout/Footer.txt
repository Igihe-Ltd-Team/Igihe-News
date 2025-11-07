import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Logo />
            <p className="mt-4 text-gray-400 max-w-md">
              IGIHE Ltd - Rwanda's leading news platform delivering breaking news, 
              in-depth analysis, and multimedia content to millions of readers.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Categories</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/category/politics" className="hover:text-white transition-colors">Politics</a></li>
              <li><a href="/category/business" className="hover:text-white transition-colors">Business</a></li>
              <li><a href="/category/sports" className="hover:text-white transition-colors">Sports</a></li>
              <li><a href="/category/entertainment" className="hover:text-white transition-colors">Entertainment</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} IGIHE Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}