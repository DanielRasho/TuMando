"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDepartments, getMunicipalities, postShop } from "@/lib/api";

interface CreateShopValues {
  name: string;
  department: string;
  municipality: string;
}

export function CreateShopDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<CreateShopValues>({
    mode: "onBlur",
    defaultValues: { name: "", department: "", municipality: "" },
  });

  const selectedDepartment = watch("department");

  const departmentsQuery = useQuery({ queryKey: ["departments"], queryFn: getDepartments });
  const municipalitiesQuery = useQuery({ queryKey: ["municipalities"], queryFn: getMunicipalities });

  const filteredMunicipalities = useMemo(() => {
    const municipalities = municipalitiesQuery.data ?? [];
    if (!selectedDepartment) return [];
    return municipalities.filter((m) => String(m.department) === selectedDepartment);
  }, [selectedDepartment, municipalitiesQuery.data]);

  useEffect(() => {
    setValue("municipality", "");
  }, [selectedDepartment, setValue]);

  const createMutation = useMutation({
    mutationFn: (values: CreateShopValues) =>
      postShop({
        name: values.name,
        department: parseInt(values.department, 10),
        municipality: parseInt(values.municipality, 10),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shops"] });
      toast.success("Shop created successfully");
      reset();
      setOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create shop");
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    // Manual validation
    if (!values.name || values.name.length === 0) {
      toast.error("Name is required");
      return;
    }
    if (values.name.length > 50) {
      toast.error("Name must be 50 characters or less");
      return;
    }
    if (!values.department) {
      toast.error("Department is required");
      return;
    }
    if (!values.municipality) {
      toast.error("Municipality is required");
      return;
    }

    return createMutation.mutateAsync(values);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full xl:w-auto">
          <Plus className="size-4" />
          Create shop
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create shop</DialogTitle>
          <DialogDescription>Register a new shop by selecting its location.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shop-name">Name</Label>
            <Input id="shop-name" placeholder="Centro, Norte..." {...register("name")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shop-dept">Department</Label>
            <Select
              value={selectedDepartment}
              onValueChange={(value) => setValue("department", value, { shouldValidate: true })}
              disabled={departmentsQuery.isLoading}
            >
              <SelectTrigger id="shop-dept" className="w-full">
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                {(departmentsQuery.data ?? []).map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shop-muni">Municipality</Label>
            <Select
              value={watch("municipality")}
              onValueChange={(value) => setValue("municipality", value, { shouldValidate: true })}
              disabled={!selectedDepartment || municipalitiesQuery.isLoading}
            >
              <SelectTrigger id="shop-muni" className="w-full">
                <SelectValue placeholder={selectedDepartment ? "Select a municipality" : "Select a department first"} />
              </SelectTrigger>
              <SelectContent>
                {filteredMunicipalities.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Create shop
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
