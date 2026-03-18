import React from 'react';
import { Settings, Language, Theme } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark ${className}`}>
    {children}
  </div>
);

const SettingsGroup: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <div className="mt-4 space-y-4">{children}</div>
    </div>
);

const Toggle: React.FC<{label: string; description?: string; id: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ label, description, id, checked, onChange }) => (
    <div>
        <div className="flex items-center justify-between">
            <label htmlFor={id} className="font-medium text-gray-800 dark:text-gray-200">{label}</label>
            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name={id} id={id} checked={checked} onChange={onChange} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                <label htmlFor={id} className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-700 cursor-pointer"></label>
            </div>
        </div>
        {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
    </div>
);

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetSettings, auth, showToast } = useAppContext();
  const { language, setLanguage, t } = useTranslation();
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  const handleUpgrade = async (plan: 'growth' | 'elite') => {
    setIsRedirecting(true);
    try {
        const response = await fetch('/api/create-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan })
        });
        const data = await response.json();
        if (data.url) {
            window.location.href = data.url;
        } else {
            throw new Error(data.error || 'Failed to create checkout session');
        }
    } catch (err: any) {
        showToast({ message: `Payment Error: ${err.message}`, type: 'error' });
    } finally {
        setIsRedirecting(false);
    }
  };

  const handleSettingChange = (section: keyof Settings | 'language' | 'theme', key: string, value: any) => {
    if (section === 'autopilot' || key === 'mockMode') {
        const newSettings = {...settings};
        if (key === 'mockMode') {
            newSettings.mockMode = value;
        } else {
            newSettings.autopilot = { ...settings.autopilot, [key]: value };
        }
        updateSettings(newSettings);
    } else if (section === 'language') {
        setLanguage(value);
    } else if (section === 'theme') {
         updateSettings({ ...settings, theme: value });
    }
  };
  
  const handleReset = () => {
    resetSettings();
    setLanguage('en');
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('settings_title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('settings_subtitle')}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <SettingsGroup title={t('settings_autopilot')}>
                    <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('settings_frequency')}</label>
                        <select name="frequency" value={settings.autopilot.frequency} onChange={e => handleSettingChange('autopilot', 'frequency', e.target.value)} className="mt-1 block w-full bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-md p-2">
                            <option value="6h">{t('automation_freq_6h')}</option>
                            <option value="daily">{t('automation_freq_daily')}</option>
                            <option value="weekly">{t('automation_freq_weekly')}</option>
                        </select>
                    </div>
                    <Toggle label={t('settings_safe_mode')} description={t('settings_safe_mode_desc')} id="safeMode" checked={settings.autopilot.safeMode} onChange={e => handleSettingChange('autopilot', 'safeMode', e.target.checked)}/>
                    <Toggle label={t('settings_auto_approve')} description={t('settings_auto_approve_desc')} id="autoApprove" checked={settings.autopilot.autoApprove} onChange={e => handleSettingChange('autopilot', 'autoApprove', e.target.checked)} />
                </SettingsGroup>
            </Card>

            {/* NEW: Etsy Shop Management */}
            <Card>
                <SettingsGroup title="Etsy Shop Management">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xl">
                                {auth.user?.name?.charAt(0) || 'E'}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">{auth.user?.name || 'Etsy Shop'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Connected via OAuth 2.0</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                Connected
                            </span>
                            <button className="text-xs text-red-500 hover:underline">Disconnect</button>
                        </div>
                    </div>
                    <button className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-all">
                        + Add Another Shop (Elite Plan)
                    </button>
                </SettingsGroup>
            </Card>

            {/* NEW: Subscription & Billing */}
            <Card>
                <SettingsGroup title="Subscription & Billing">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                            <p className="text-xs opacity-80 uppercase tracking-widest font-bold">Current Plan</p>
                            <h4 className="text-2xl font-black mt-1">Growth Plan</h4>
                            <p className="text-sm mt-4 opacity-90">$19/month • Renews April 10, 2026</p>
                        </div>
                        <div className="flex flex-col justify-center gap-2">
                            <button 
                                onClick={() => handleUpgrade('growth')}
                                disabled={isRedirecting}
                                className="w-full py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                            >
                                {isRedirecting ? 'Processing...' : 'Manage Subscription'}
                            </button>
                            <button 
                                onClick={() => handleUpgrade('elite')}
                                disabled={isRedirecting}
                                className="w-full py-2 bg-orange-100 dark:bg-orange-900/30 text-purple-700 dark:text-orange-300 rounded-xl text-sm font-bold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all disabled:opacity-50"
                            >
                                Upgrade to Elite
                            </button>
                        </div>
                    </div>
                </SettingsGroup>
            </Card>
        </div>
        
        <div className="lg:col-span-1 space-y-8">
             <Card>
                <SettingsGroup title={t('settings_preferences')}>
                    <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('settings_language')}</label>
                        <select value={language} onChange={e => handleSettingChange('language', 'language', e.target.value as Language)} className="mt-1 block w-full bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-md p-2">
                            <option value="en">English</option>
                            <option value="fr">French (Français)</option>
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('settings_theme')}</label>
                        <select name="theme" value={settings.theme} onChange={e => handleSettingChange('theme', 'theme', e.target.value as Theme)} className="mt-1 block w-full bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-md p-2">
                            <option value="light">{t('theme_light')}</option>
                            <option value="dark">{t('theme_dark')}</option>
                            <option value="system">{t('theme_system')}</option>
                        </select>
                    </div>
                    <Toggle label={t('settings_realtime_notifications')} id="notifications" checked={settings.autopilot.notifications} onChange={e => handleSettingChange('autopilot', 'notifications', e.target.checked)} />
                    <Toggle label={t('settings_performance_analytics')} id="analytics" checked={settings.autopilot.analytics} onChange={e => handleSettingChange('autopilot', 'analytics', e.target.checked)} />
                    <Toggle label={t('settings_mock_mode')} description={t('settings_mock_mode_desc')} id="mockMode" checked={settings.mockMode} onChange={e => handleSettingChange('autopilot', 'mockMode', e.target.checked)} />
                </SettingsGroup>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30">
                <SettingsGroup title="Hasti AI Personality">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-orange-800 dark:text-orange-400 uppercase tracking-widest">Vibe Level</label>
                            <input type="range" min="0" max="100" defaultValue="85" className="accent-orange-500" />
                            <div className="flex justify-between text-[10px] font-bold text-orange-600">
                                <span>PROFESSIONAL</span>
                                <span>SASSY & FLIRTY</span>
                            </div>
                        </div>
                    </div>
                </SettingsGroup>
            </Card>
        </div>
      </div>

       <div className="flex justify-start space-x-4">
            <button 
              onClick={handleReset}
              className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-2 px-6 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                {t('settings_reset_button')}
            </button>
        </div>
    </div>
  );
};

export default SettingsPage;