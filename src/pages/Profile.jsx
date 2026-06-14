import React, { useState, useEffect } from 'react';
import api from '../api.js';
import { useAuth } from '../context.jsx';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    gender: 'Male',
    nationalIdRef: '',
    dateOfBirth: '',
    nomineeDetails: '',
    dateOfRetirement: '',
    companyName: '',
    registrationNumber: '',
    industry: '',
    remittanceFrequency: 0,
    contactDetails: ''
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      // We will try to fetch the member profile.
      // If the user is an Employer or Admin, this might fail or return different data.
      // We'll focus on Member for this feature as requested.
      if (user?.role === 'Member') {
        const me = await api.get('/api/members/me');
        setProfile(me.data);
        setForm(f => ({
          ...f,
          name: me.data.name || user?.name || '',
          gender: me.data.gender || 'Male',
          nationalIdRef: me.data.nationalIdRef || '',
          dateOfBirth: me.data.dateOfBirth ? new Date(me.data.dateOfBirth).toISOString().split('T')[0] : '',
          nomineeDetails: me.data.nomineeDetails || '',
          dateOfRetirement: me.data.dateOfRetirement ? new Date(me.data.dateOfRetirement).toISOString().split('T')[0] : ''
        }));
      } else if (user?.role === 'Employer') {
        const emp = await api.get('/api/employers/me');
        setProfile(emp.data);
        
        let cleanedContact = emp.data.contactDetails || '';
        try {
          const parsed = JSON.parse(cleanedContact);
          cleanedContact = parsed.email || parsed.phone || cleanedContact;
        } catch { }

        setForm(f => ({
          ...f,
          name: user?.name || '',
          companyName: emp.data.companyName || '',
          registrationNumber: emp.data.registrationNumber || '',
          industry: emp.data.industry || '',
          remittanceFrequency: emp.data.remittanceFrequency ?? 0,
          contactDetails: cleanedContact
        }));
      } else {
        // Just show basic user info if not a member or employer
        setForm(f => ({ ...f, name: user?.name || '' }));
      }
    } catch (err) {
      console.error(err);
      setError('Could not load profile details. You may need to complete enrollment first.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (user?.role === 'Member') {
        if (!profile) return;
        const updateData = {
          name: form.name,
          gender: form.gender,
          nationalIdRef: form.nationalIdRef,
          dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : null,
          nomineeDetails: form.nomineeDetails,
          dateOfRetirement: form.dateOfRetirement ? new Date(form.dateOfRetirement).toISOString() : null,
          status: profile.status
        };
        await api.put(`/api/members/${profile.memberId}`, updateData);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
        await loadProfile();
      } else if (user?.role === 'Employer') {
        const userUpdateData = { name: form.name };
        const response = await api.put('/api/users/me', userUpdateData);
        if (profile) {
          const empUpdateData = {
            companyName: form.companyName,
            industry: form.industry,
            remittanceFrequency: form.remittanceFrequency,
            contactDetails: form.contactDetails,
            status: profile.status
          };
          await api.put(`/api/employers/${profile.employerId}`, empUpdateData);
        }
        setSuccess('Profile updated successfully!');
        const updatedUser = { ...user, name: response.data.name };
        localStorage.setItem('pv_user', JSON.stringify(updatedUser));
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const updateData = { name: form.name };
        const response = await api.put('/api/users/me', updateData);
        setSuccess('Profile updated successfully!');
        const updatedUser = { ...user, name: response.data.name };
        localStorage.setItem('pv_user', JSON.stringify(updatedUser));
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setSaving(true);
      setError('');
      const response = await api.post('/api/users/me/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Profile picture updated!');
      setTimeout(() => setSuccess(''), 3000);
      await loadProfile(); // Reload to get new image URL
      
      if (user) {
        const updatedUser = { ...user, profileImageUrl: response.data.profileImageUrl };
        localStorage.setItem('pv_user', JSON.stringify(updatedUser));
        window.location.reload(); 
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload image.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-body"><div className="spinner" style={{marginTop:40}} /></div>;

  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">My Profile</div>
          <div className="page-desc">Manage your personal details and account settings</div>
        </div>
      </div>

      <div className="profile-layout" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div className="table-card profile-main-card" style={{ flex: 1, padding: 32 }}>
          <div className="profile-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Personal Details</h3>
            
            <div className="profile-avatar-wrapper" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => document.getElementById('avatar-upload').click()}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 700, overflow: 'hidden', border: '2px solid var(--card-border)' }}>
                {user?.profileImageUrl || profile?.profileImageUrl ? (
                  <img src={`http://localhost:5000${user?.profileImageUrl || profile?.profileImageUrl}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }} />
                ) : null}
                <span style={{ display: (user?.profileImageUrl || profile?.profileImageUrl) ? 'none' : 'block' }}>
                  {user?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || 'PV'}
                </span>
              </div>
              <div style={{ position: 'absolute', bottom: -4, right: -4, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              </div>
              <input type="file" id="avatar-upload" style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
            </div>
          </div>
          
          {user?.role === 'Admin' || user?.role === 'FundAdmin' || user?.role === 'Compliance' ? (
            <form onSubmit={handleSave}>
              {error && <div className="lp-error" style={{marginBottom:24, padding: 12, background: 'var(--danger-subtle)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500}}>{error}</div>}
              {success && <div style={{marginBottom:24, padding: 12, background: 'var(--success-subtle)', color: 'var(--success)', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500}}>{success}</div>}
              
              <div className="form-group" style={{marginBottom: 20}}>
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({...form, name:e.target.value})} required />
              </div>

              <div className="form-group" style={{marginBottom: 32}}>
                <label className="form-label">Role</label>
                <input className="form-input" value={user?.role} disabled />
              </div>

              <div className="profile-save-wrapper" style={{display: 'flex', justifyContent: 'flex-end'}}>
                <button type="submit" className="btn btn-primary" style={{ height: 40, padding: '0 24px' }} disabled={saving}>
                  {saving ? <span className="spinner" style={{width:16,height:16,margin:0, borderTopColor: '#fff'}} /> : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : user?.role === 'Employer' ? (
            <form onSubmit={handleSave}>
              {error && <div className="lp-error" style={{marginBottom:24, padding: 12, background: 'var(--danger-subtle)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500}}>{error}</div>}
              {success && <div style={{marginBottom:24, padding: 12, background: 'var(--success-subtle)', color: 'var(--success)', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500}}>{success}</div>}
              
              <div className="form-group" style={{marginBottom: 20}}>
                <label className="form-label">Contact Person Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({...form, name:e.target.value})} required />
              </div>

              <div className="profile-form-row" style={{display: 'flex', gap: 20, marginBottom: 20}}>
                <div className="form-group" style={{flex: 1}}>
                  <label className="form-label">Company Name *</label>
                  <input className="form-input" value={form.companyName} onChange={e => setForm({...form, companyName:e.target.value})} required />
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label className="form-label">Registration Number</label>
                  <input className="form-input" value={form.registrationNumber} disabled />
                </div>
              </div>

              <div className="profile-form-row" style={{display: 'flex', gap: 20, marginBottom: 20}}>
                <div className="form-group" style={{flex: 1}}>
                  <label className="form-label">Industry</label>
                  <input className="form-input" value={form.industry} onChange={e => setForm({...form, industry:e.target.value})} />
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label className="form-label">Remittance Frequency</label>
                  <select className="form-input" value={form.remittanceFrequency} onChange={e => setForm({...form, remittanceFrequency: parseInt(e.target.value, 10)})}>
                    <option value={0}>Monthly</option>
                    <option value={1}>Quarterly</option>
                    <option value={2}>Annually</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{marginBottom: 32}}>
                <label className="form-label">Contact Details</label>
                <input className="form-input" placeholder="Email, Phone, Address, etc." value={form.contactDetails} onChange={e => setForm({...form, contactDetails:e.target.value})} />
              </div>

              <div className="profile-save-wrapper" style={{display: 'flex', justifyContent: 'flex-end'}}>
                <button type="submit" className="btn btn-primary" style={{ height: 40, padding: '0 24px' }} disabled={saving}>
                  {saving ? <span className="spinner" style={{width:16,height:16,margin:0, borderTopColor: '#fff'}} /> : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : !profile ? (
            <div className="empty-state">
              <p>{error || 'No member profile found.'}</p>
            </div>
          ) : (
            <form onSubmit={handleSave}>
              {error && <div className="lp-error" style={{marginBottom:24, padding: 12, background: 'var(--danger-subtle)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500}}>{error}</div>}
              {success && <div style={{marginBottom:24, padding: 12, background: 'var(--success-subtle)', color: 'var(--success)', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500}}>{success}</div>}
              
              <div className="form-group" style={{marginBottom: 20}}>
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({...form, name:e.target.value})} required />
              </div>

              <div className="profile-form-row" style={{display: 'flex', gap: 20, marginBottom: 20}}>
                <div className="form-group" style={{flex: 1}}>
                  <label className="form-label">National ID (Aadhaar / PAN) *</label>
                  <input className="form-input" value={form.nationalIdRef} onChange={e => setForm({...form, nationalIdRef:e.target.value})} required />
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label className="form-label">Gender</label>
                  <select className="form-input" value={form.gender} onChange={e => setForm({...form, gender:e.target.value})}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>

              <div className="profile-form-row" style={{display: 'flex', gap: 20, marginBottom: 20}}>
                <div className="form-group" style={{flex: 1}}>
                  <label className="form-label">Date of Birth *</label>
                  <input className="form-input" type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth:e.target.value})} required />
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label className="form-label">Date of Retirement</label>
                  <input className="form-input" type="date" value={form.dateOfRetirement} onChange={e => setForm({...form, dateOfRetirement:e.target.value})} />
                </div>
              </div>

              <div className="form-group" style={{marginBottom: 32}}>
                <label className="form-label">Nominee Details</label>
                <input className="form-input" placeholder="Name, Relation, etc." value={form.nomineeDetails} onChange={e => setForm({...form, nomineeDetails:e.target.value})} />
              </div>

              <div className="profile-save-wrapper" style={{display: 'flex', justifyContent: 'flex-end'}}>
                <button type="submit" className="btn btn-primary" style={{ height: 40, padding: '0 24px' }} disabled={saving}>
                  {saving ? <span className="spinner" style={{width:16,height:16,margin:0, borderTopColor: '#fff'}} /> : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>

        {profile && user?.role === 'Member' && (
            <div className="table-card profile-sidebar" style={{ width: 320, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>Account Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Membership Number</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{profile.membershipNumber}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Employer</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{profile.employerName || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Status</div>
                  <div style={{ marginTop: 4 }}>
                    <span className={`badge ${profile.status === 'Active' ? 'badge-green' : profile.status === 'Pending' ? 'badge-amber' : 'badge-gray'}`}>
                      {profile.status}
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Joining Date</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : '—'}</div>
                </div>
              </div>
            </div>
        )}
        {profile && user?.role === 'Employer' && (
            <div className="table-card profile-sidebar" style={{ width: 320, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>Employer Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Registration Number</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{profile.registrationNumber}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Members Enrolled</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{profile.enrolledMemberCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Status</div>
                  <div style={{ marginTop: 4 }}>
                    <span className={`badge ${profile.status === 'Active' ? 'badge-green' : profile.status === 'Pending' ? 'badge-amber' : 'badge-gray'}`}>
                      {profile.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
        )}
      </div>
    </div>
  );
}
