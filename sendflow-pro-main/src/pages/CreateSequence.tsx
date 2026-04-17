import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/api/client";

interface SequenceStep {
  step_number: number;
  subject: string;
  body: string;
  delay_hours: number;
  sender_name?: string;
  priority: string;
  send_window_start?: string;
  send_window_end?: string;
  weekdays_only: boolean;
}

const CreateSequence = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const [steps, setSteps] = useState<SequenceStep[]>([
    {
      step_number: 1,
      subject: '',
      body: '',
      delay_hours: 0,
      priority: 'normal',
      weekdays_only: true,
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addStep = () => {
    const newStep: SequenceStep = {
      step_number: steps.length + 1,
      subject: '',
      body: '',
      delay_hours: 24, // Default 1 day delay
      priority: 'normal',
      weekdays_only: true,
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, field: keyof SequenceStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      // Create the sequence
      const sequence = await api.createSequence(token, {
        name: formData.name,
        description: formData.description,
      });

      // Add steps
      for (const step of steps) {
        await api.createSequenceStep(token, sequence.id, step);
      }

      toast({
        title: 'Sequence created!',
        description: 'Your email sequence is ready to use.',
      });
      navigate('/');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create sequence';
      setError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link to="/app">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Email Sequence</h1>
          <p className="text-sm text-muted-foreground">
            Build a multi-step email drip campaign
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sequence Details */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-base">Sequence Details</CardTitle>
            <CardDescription>Basic information about your email sequence</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Sequence Name</Label>
              <Input
                id="name"
                placeholder="e.g. Product Launch Nurture"
                className="bg-background border-border"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this sequence"
                rows={2}
                className="bg-background border-border resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sequence Steps */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-base">Email Steps</CardTitle>
            <CardDescription>
              Configure each step in your sequence. Steps will be sent in order with delays between them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Step {step.step_number}</h4>
                  {steps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Delay from Previous Step</Label>
                    <Select
                      value={step.delay_hours.toString()}
                      onValueChange={(value) => updateStep(index, 'delay_hours', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Send immediately</SelectItem>
                        <SelectItem value="24">1 day</SelectItem>
                        <SelectItem value="48">2 days</SelectItem>
                        <SelectItem value="72">3 days</SelectItem>
                        <SelectItem value="168">1 week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={step.priority}
                      onValueChange={(value) => updateStep(index, 'priority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Subject Line</Label>
                  <Input
                    placeholder="Enter subject line"
                    value={step.subject}
                    onChange={(e) => updateStep(index, 'subject', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Body</Label>
                  <Textarea
                    placeholder="Write your email content. Use {{first_name}}, {{company}}, etc. for personalization."
                    rows={6}
                    value={step.body}
                    onChange={(e) => updateStep(index, 'body', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sender Name (Optional)</Label>
                  <Input
                    placeholder="e.g. John from Acme Corp"
                    value={step.sender_name || ''}
                    onChange={(e) => updateStep(index, 'sender_name', e.target.value)}
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addStep}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Step
            </Button>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-700 text-sm">
            Error: {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link to="/app" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading || !formData.name || steps.some(s => !s.subject || !s.body)}
            className="flex-1 gradient-accent text-white border-0 hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Sequence'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateSequence;
