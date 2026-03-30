import React, { useContext, useRef } from 'react';
import { Mail, ShieldCheck, Camera } from 'lucide-react';
import { AuthContext } from './AuthContext';

const CaretakerProfile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const fileInputRef = useRef(null);

  if (!user) return <div className="p-8 text-center">Loading profile...</div>;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      updateUser({ avatar: imageUrl });
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">My Profile</h1>
        <p className="text-slate-500 mt-1">Manage your caretaker credentials and settings.</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row gap-8 items-start">
        
        <div className="flex flex-col items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
            <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden relative">
              
              {user.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-slate-400">{getInitials(user.name)}</span>
              )}
              
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white mb-1" />
                <span className="text-white text-xs font-semibold">Edit Photo</span>
              </div>
            </div>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            accept="image/*" 
            className="hidden" 
          />

          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            Active Caretaker
          </span>
        </div>

        <div className="flex-1 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{user.name}</h2>
            <p className="text-slate-500">Registered Caretaker Account</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div>
              <label className="text-sm font-medium text-slate-400">Email Address</label>
              <div className="flex items-center gap-2 mt-1 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400" />
                {user.email}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-400">Database ID</label>
              <div className="mt-1 text-slate-700 font-mono">VT-USER-{user.id}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaretakerProfile;
