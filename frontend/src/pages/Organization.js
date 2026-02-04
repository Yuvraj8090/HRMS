import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { companyService } from '../services/companyService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'; // Assuming you have this shadcn component
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Building2, Users, Briefcase, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const Organization = () => {
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  
  // Dialog State
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [showBranchDialog, setShowBranchDialog] = useState(false);
  const [showDeptDialog, setShowDeptDialog] = useState(false);
  const [showTeamDialog, setShowTeamDialog] = useState(false);

  const user = JSON.parse(localStorage.getItem('user'));
  const isSuperAdmin = user?.role === 'super_admin';
  const isCompanyAdmin = user?.role === 'company_admin';
  const targetCompanyId = user?.company_id; // For company admins

  // Forms State
  const [companyForm, setCompanyForm] = useState({ name: '', code: '', country: '', currency: 'USD', timezone: 'UTC' });
  const [branchForm, setBranchForm] = useState({ name: '', code: '', address: '', phone: '' });
  const [deptForm, setDeptForm] = useState({ name: '', code: '', branch_id: '' });
  const [teamForm, setTeamForm] = useState({ name: '', code: '', department_id: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load Companies (Visible to everyone, or filtered by backend)
      const companiesData = await companyService.getCompanies();
      setCompanies(companiesData);

      // 2. Load Organization Structure (Only if user has a company_id)
      if (targetCompanyId) {
        const [branchesData, deptsData, teamsData] = await Promise.all([
          companyService.getBranches(targetCompanyId),
          companyService.getDepartments(targetCompanyId),
          companyService.getTeams(targetCompanyId)
        ]);
        setBranches(branchesData);
        setDepartments(deptsData);
        setTeams(teamsData);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      await companyService.createCompany(companyForm);
      toast.success('Company created successfully');
      setShowCompanyDialog(false);
      setCompanyForm({ name: '', code: '', country: '', currency: 'USD', timezone: 'UTC' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create company');
    }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      await companyService.createBranch(targetCompanyId, {
        ...branchForm,
        company_id: targetCompanyId
      });
      toast.success('Branch created successfully');
      setShowBranchDialog(false);
      setBranchForm({ name: '', code: '', address: '', phone: '' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create branch');
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    try {
      await companyService.createDepartment(targetCompanyId, {
        ...deptForm,
        company_id: targetCompanyId,
        // Send null if empty string to avoid backend validation error
        branch_id: deptForm.branch_id || null 
      });
      toast.success('Department created successfully');
      setShowDeptDialog(false);
      setDeptForm({ name: '', code: '', branch_id: '' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create department');
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await companyService.createTeam(targetCompanyId, {
        ...teamForm,
        company_id: targetCompanyId
      });
      toast.success('Team created successfully');
      setShowTeamDialog(false);
      setTeamForm({ name: '', code: '', department_id: '' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create team');
    }
  };

  // --- RENDER HELPERS ---

  if (loading) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-700 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div data-testid="organization-page">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Organization Structure
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {isSuperAdmin ? 'Manage all companies' : 'Manage your branches, departments, and teams'}
          </p>
        </div>

        <Tabs defaultValue={isSuperAdmin ? "companies" : "branches"} className="w-full">
          <TabsList>
            {isSuperAdmin && <TabsTrigger value="companies">Companies</TabsTrigger>}
            <TabsTrigger value="branches">Branches</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>

          {/* --- COMPANIES TAB (Super Admin Only) --- */}
          {isSuperAdmin && (
            <TabsContent value="companies" className="mt-6">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Registered Companies</h3>
                <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-indigo-700 hover:bg-indigo-800">
                      <Plus className="mr-2 h-4 w-4" /> Add Company
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add New Company</DialogTitle></DialogHeader>
                    <form onSubmit={handleCreateCompany} className="space-y-4">
                      <div><Label>Name</Label><Input required value={companyForm.name} onChange={(e) => setCompanyForm({...companyForm, name: e.target.value})} /></div>
                      <div><Label>Code</Label><Input required value={companyForm.code} onChange={(e) => setCompanyForm({...companyForm, code: e.target.value})} /></div>
                      <div><Label>Country</Label><Input required value={companyForm.country} onChange={(e) => setCompanyForm({...companyForm, country: e.target.value})} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Currency</Label><Input value={companyForm.currency} onChange={(e) => setCompanyForm({...companyForm, currency: e.target.value})} /></div>
                        <div><Label>Timezone</Label><Input value={companyForm.timezone} onChange={(e) => setCompanyForm({...companyForm, timezone: e.target.value})} /></div>
                      </div>
                      <Button type="submit" className="w-full bg-indigo-700">Create Company</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {companies.map((company) => (
                  <div key={company.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="rounded-lg bg-indigo-100 p-2"><Building2 className="h-5 w-5 text-indigo-700" /></div>
                      <div><h4 className="font-semibold text-slate-900">{company.name}</h4><p className="text-xs text-slate-500 font-mono">{company.code}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          )}

          {/* --- BRANCHES TAB --- */}
          <TabsContent value="branches" className="mt-6">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Branches</h3>
              {(isCompanyAdmin || isSuperAdmin) && (
                <Dialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-indigo-700 hover:bg-indigo-800">
                      <Plus className="mr-2 h-4 w-4" /> Add Branch
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add New Branch</DialogTitle></DialogHeader>
                    <form onSubmit={handleCreateBranch} className="space-y-4">
                      <div><Label>Branch Name</Label><Input required value={branchForm.name} onChange={(e) => setBranchForm({...branchForm, name: e.target.value})} /></div>
                      <div><Label>Branch Code</Label><Input required value={branchForm.code} onChange={(e) => setBranchForm({...branchForm, code: e.target.value})} /></div>
                      <div><Label>Address</Label><Input value={branchForm.address} onChange={(e) => setBranchForm({...branchForm, address: e.target.value})} /></div>
                      <div><Label>Phone</Label><Input value={branchForm.phone} onChange={(e) => setBranchForm({...branchForm, phone: e.target.value})} /></div>
                      <Button type="submit" className="w-full bg-indigo-700">Create Branch</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {branches.length === 0 && <p className="text-slate-500 col-span-3 text-center py-8">No branches found. Create one to get started.</p>}
              {branches.map((branch) => (
                <div key={branch.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-100 p-2"><MapPin className="h-5 w-5 text-green-700" /></div>
                    <div><h4 className="font-semibold text-slate-900">{branch.name}</h4><p className="text-xs text-slate-500 font-mono">{branch.code}</p></div>
                  </div>
                  {branch.address && <p className="mt-3 text-sm text-slate-600">{branch.address}</p>}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* --- DEPARTMENTS TAB --- */}
          <TabsContent value="departments" className="mt-6">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Departments</h3>
              {(isCompanyAdmin || isSuperAdmin) && (
                <Dialog open={showDeptDialog} onOpenChange={setShowDeptDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-indigo-700 hover:bg-indigo-800">
                      <Plus className="mr-2 h-4 w-4" /> Add Department
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add New Department</DialogTitle></DialogHeader>
                    <form onSubmit={handleCreateDepartment} className="space-y-4">
                      <div><Label>Department Name</Label><Input required value={deptForm.name} onChange={(e) => setDeptForm({...deptForm, name: e.target.value})} /></div>
                      <div><Label>Department Code</Label><Input required value={deptForm.code} onChange={(e) => setDeptForm({...deptForm, code: e.target.value})} /></div>
                      
                      {/* Branch Selection */}
                      <div>
                        <Label>Assign to Branch (Optional)</Label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={deptForm.branch_id}
                          onChange={(e) => setDeptForm({...deptForm, branch_id: e.target.value})}
                        >
                          <option value="">-- Select Branch --</option>
                          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>

                      <Button type="submit" className="w-full bg-indigo-700">Create Department</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {departments.length === 0 && <p className="text-slate-500 col-span-3 text-center py-8">No departments found.</p>}
              {departments.map((dept) => {
                const parentBranch = branches.find(b => b.id === dept.branch_id);
                return (
                  <div key={dept.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-2"><Briefcase className="h-5 w-5 text-blue-700" /></div>
                      <div><h4 className="font-semibold text-slate-900">{dept.name}</h4><p className="text-xs text-slate-500 font-mono">{dept.code}</p></div>
                    </div>
                    {parentBranch && (
                      <div className="mt-3 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                        <MapPin className="mr-1 h-3 w-3" />
                        {parentBranch.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* --- TEAMS TAB --- */}
          <TabsContent value="teams" className="mt-6">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Teams</h3>
              {(isCompanyAdmin || isSuperAdmin) && (
                <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-indigo-700 hover:bg-indigo-800">
                      <Plus className="mr-2 h-4 w-4" /> Add Team
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add New Team</DialogTitle></DialogHeader>
                    <form onSubmit={handleCreateTeam} className="space-y-4">
                      <div><Label>Team Name</Label><Input required value={teamForm.name} onChange={(e) => setTeamForm({...teamForm, name: e.target.value})} /></div>
                      <div><Label>Team Code</Label><Input required value={teamForm.code} onChange={(e) => setTeamForm({...teamForm, code: e.target.value})} /></div>
                      
                      {/* Department Selection */}
                      <div>
                        <Label>Assign to Department</Label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          required
                          value={teamForm.department_id}
                          onChange={(e) => setTeamForm({...teamForm, department_id: e.target.value})}
                        >
                          <option value="">-- Select Department --</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>

                      <Button type="submit" className="w-full bg-indigo-700">Create Team</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teams.length === 0 && <p className="text-slate-500 col-span-3 text-center py-8">No teams found.</p>}
              {teams.map((team) => {
                const parentDept = departments.find(d => d.id === team.department_id);
                return (
                  <div key={team.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-orange-100 p-2"><Users className="h-5 w-5 text-orange-700" /></div>
                      <div><h4 className="font-semibold text-slate-900">{team.name}</h4><p className="text-xs text-slate-500 font-mono">{team.code}</p></div>
                    </div>
                    {parentDept && (
                      <div className="mt-3 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                        <Briefcase className="mr-1 h-3 w-3" />
                        {parentDept.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>
          
        </Tabs>
      </div>
    </Layout>
  );
};

export default Organization;