import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, Package, TrendingUp, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Survey {
  id: string;
  name: string;
  mobile: string;
  panchayath: string;
  ward: string;
  user_type: string;
  created_at: string;
  items?: { item_name: string; item_type: string }[];
}

interface ItemDemand {
  item_name: string;
  count: number;
}

interface Panchayath {
  id: string;
  name: string;
  ward_count: number;
  created_at: string;
}

export default function AdminPanel() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [filteredSurveys, setFilteredSurveys] = useState<Survey[]>([]);
  const [panchayaths, setPanchayaths] = useState<Panchayath[]>([]);
  const [selectedPanchayath, setSelectedPanchayath] = useState<string>("all");
  const [demandedItems, setDemandedItems] = useState<ItemDemand[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPanchayath, setNewPanchayath] = useState("");
  const [newWardCount, setNewWardCount] = useState("");
  
  // Edit dialogs
  const [editPanchayathDialog, setEditPanchayathDialog] = useState(false);
  const [editSurveyDialog, setEditSurveyDialog] = useState(false);
  const [editingPanchayath, setEditingPanchayath] = useState<Panchayath | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingWardCount, setEditingWardCount] = useState("");
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  
  // Delete dialogs
  const [deletePanchayathDialog, setDeletePanchayathDialog] = useState(false);
  const [deleteSurveyDialog, setDeleteSurveyDialog] = useState(false);
  const [deletingPanchayath, setDeletingPanchayath] = useState<Panchayath | null>(null);
  const [deletingSurvey, setDeletingSurvey] = useState<Survey | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedPanchayath === "all") {
      setFilteredSurveys(surveys);
    } else {
      setFilteredSurveys(surveys.filter(s => s.panchayath === selectedPanchayath));
    }
  }, [selectedPanchayath, surveys]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch surveys with their items
      const { data: surveysData, error: surveysError } = await supabase
        .from("surveys")
        .select(`
          *,
          items:survey_items(item_name, item_type)
        `)
        .order("created_at", { ascending: false });

      if (surveysError) throw surveysError;
      setSurveys(surveysData || []);
      setFilteredSurveys(surveysData || []);

      // Fetch panchayaths from the panchayaths table
      const { data: panchayathsData, error: panchayathsError } = await supabase
        .from("panchayaths")
        .select("*")
        .order("name", { ascending: true });

      if (panchayathsError) throw panchayathsError;
      setPanchayaths(panchayathsData || []);

      // Fetch most demanded items
      const { data: itemsData, error: itemsError } = await supabase
        .from("survey_items")
        .select("item_name");

      if (itemsError) throw itemsError;

      // Count occurrences
      const itemCounts: { [key: string]: number } = {};
      itemsData?.forEach(item => {
        itemCounts[item.item_name] = (itemCounts[item.item_name] || 0) + 1;
      });

      const sortedItems = Object.entries(itemCounts)
        .map(([name, count]) => ({ item_name: name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setDemandedItems(sortedItems);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function addPanchayath() {
    if (!newPanchayath.trim()) {
      toast.error("Please enter a panchayath name");
      return;
    }

    const wardCount = parseInt(newWardCount);
    if (!newWardCount.trim() || isNaN(wardCount) || wardCount < 1) {
      toast.error("Please enter a valid ward count");
      return;
    }

    try {
      const { error } = await supabase
        .from("panchayaths")
        .insert({ 
          name: newPanchayath.trim(),
          ward_count: wardCount
        });

      if (error) throw error;

      toast.success("Panchayath added successfully");
      setNewPanchayath("");
      setNewWardCount("");
      fetchData();
      // Refresh panchayaths list
      if (!panchayaths.includes(newPanchayath.trim())) {
        setPanchayaths([...panchayaths, newPanchayath.trim()]);
      }
    } catch (error: any) {
      console.error("Error adding panchayath:", error);
      if (error.code === "23505") {
        toast.error("This panchayath already exists");
      } else {
        toast.error("Failed to add panchayath");
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Survey results and analytics</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Surveys</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{surveys.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Panchayaths</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{panchayaths.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{demandedItems.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Add Panchayath Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add Panchayath</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Enter panchayath name"
                value={newPanchayath}
                onChange={(e) => setNewPanchayath(e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Number of wards"
                value={newWardCount}
                onChange={(e) => setNewWardCount(e.target.value)}
                min="1"
                className="sm:w-48"
              />
              <Button onClick={addPanchayath}>Add</Button>
            </div>
          </CardContent>
        </Card>

        {/* Most Demanded Products/Services */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Most Demanded Products & Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demandedItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium">{item.item_name}</span>
                  <div className="flex items-center gap-4">
                    <div className="w-48 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${(item.count / demandedItems[0].count) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground min-w-[3rem] text-right">
                      {item.count} requests
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Survey Results Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Survey Results</CardTitle>
              <Select value={selectedPanchayath} onValueChange={setSelectedPanchayath}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by Panchayath" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Panchayaths</SelectItem>
                  {panchayaths.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Panchayath</TableHead>
                    <TableHead>Ward</TableHead>
                    <TableHead>User Type</TableHead>
                    <TableHead>Products/Services</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSurveys.map((survey) => (
                    <TableRow key={survey.id}>
                      <TableCell className="font-medium">{survey.name}</TableCell>
                      <TableCell>{survey.mobile}</TableCell>
                      <TableCell>{survey.panchayath}</TableCell>
                      <TableCell>{survey.ward}</TableCell>
                      <TableCell className="capitalize">{survey.user_type}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {survey.items?.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                            >
                              {item.item_name}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(survey.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredSurveys.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No surveys found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Panchayath Dialog */}
      <Dialog open={editPanchayathDialog} onOpenChange={setEditPanchayathDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Panchayath</DialogTitle>
            <DialogDescription>Update panchayath details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Panchayath Name</Label>
              <Input
                id="edit-name"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                placeholder="Panchayath Name"
              />
            </div>
            <div>
              <Label htmlFor="edit-ward-count">Ward Count</Label>
              <Input
                id="edit-ward-count"
                type="number"
                value={editingWardCount}
                onChange={(e) => setEditingWardCount(e.target.value)}
                placeholder="Ward Count"
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPanchayathDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updatePanchayath}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Panchayath Dialog */}
      <AlertDialog open={deletePanchayathDialog} onOpenChange={setDeletePanchayathDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Panchayath</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingPanchayath?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deletePanchayath} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Survey Dialog */}
      <Dialog open={editSurveyDialog} onOpenChange={setEditSurveyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Survey</DialogTitle>
            <DialogDescription>Update survey details</DialogDescription>
          </DialogHeader>
          {editingSurvey && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-survey-name">Name</Label>
                <Input
                  id="edit-survey-name"
                  value={editingSurvey.name}
                  onChange={(e) => setEditingSurvey({ ...editingSurvey, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-survey-mobile">Mobile</Label>
                <Input
                  id="edit-survey-mobile"
                  value={editingSurvey.mobile}
                  onChange={(e) => setEditingSurvey({ ...editingSurvey, mobile: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-survey-panchayath">Panchayath</Label>
                <Select
                  value={editingSurvey.panchayath}
                  onValueChange={(value) => setEditingSurvey({ ...editingSurvey, panchayath: value })}
                >
                  <SelectTrigger id="edit-survey-panchayath">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {panchayaths.map(p => (
                      <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-survey-ward">Ward</Label>
                <Input
                  id="edit-survey-ward"
                  value={editingSurvey.ward}
                  onChange={(e) => setEditingSurvey({ ...editingSurvey, ward: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-survey-type">User Type</Label>
                <Select
                  value={editingSurvey.user_type}
                  onValueChange={(value) => setEditingSurvey({ ...editingSurvey, user_type: value })}
                >
                  <SelectTrigger id="edit-survey-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Citizen">Citizen</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSurveyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateSurvey}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Survey Dialog */}
      <AlertDialog open={deleteSurveyDialog} onOpenChange={setDeleteSurveyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Survey</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the survey from "{deletingSurvey?.name}"? This will also delete all associated survey items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSurvey} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
