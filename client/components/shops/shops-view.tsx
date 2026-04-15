"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { ComponentType, useDeferredValue, useMemo, useState } from "react";
import { Building2, MapPinned, Search } from "lucide-react";

import { DataTable } from "@/components/ui/table/data-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Department, getDepartments, getMunicipalities, getShops, Municipality, Shop } from "@/lib/api";
import { CreateShopDialog } from "@/components/shops/create-shop-dialog";

const shopsColumns = (
  departmentById: Map<number, string>,
  municipalityById: Map<number, string>
): ColumnDef<Shop>[] => [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => departmentById.get(row.original.department) ?? `#${row.original.department}`,
  },
  {
    accessorKey: "municipality",
    header: "Municipality",
    cell: ({ row }) => municipalityById.get(row.original.municipality) ?? `#${row.original.municipality}`,
  },
];

export function ShopsView() {
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("all");
  const [municipalityId, setMunicipalityId] = useState<string>("all");

  const deferredSearch = useDeferredValue(search.trim());

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
  });

  const municipalitiesQuery = useQuery({
    queryKey: ["municipalities"],
    queryFn: getMunicipalities,
  });

  const filteredMunicipalities = useMemo(() => {
    const municipalities = municipalitiesQuery.data ?? [];

    if (departmentId === "all") {
      return municipalities;
    }

    return municipalities.filter((municipality) => String(municipality.department) === departmentId);
  }, [departmentId, municipalitiesQuery.data]);

  const shopsQuery = useQuery({
    queryKey: ["shops", deferredSearch, departmentId, municipalityId],
    queryFn: () =>
      getShops({
        name: deferredSearch || undefined,
        departmentId: departmentId === "all" ? undefined : departmentId,
        municipalityId: municipalityId === "all" ? undefined : municipalityId,
      }),
  });

  const departmentById = useMemo(
    () => new Map((departmentsQuery.data ?? []).map((department) => [department.id, department.name])),
    [departmentsQuery.data]
  );

  const municipalityById = useMemo(
    () => new Map((municipalitiesQuery.data ?? []).map((municipality) => [municipality.id, municipality.name])),
    [municipalitiesQuery.data]
  );

  const columns = useMemo(() => shopsColumns(departmentById, municipalityById), [departmentById, municipalityById]);

  const filtersLoading = departmentsQuery.isLoading || municipalitiesQuery.isLoading;
  const filtersError = departmentsQuery.error || municipalitiesQuery.error;

  return (
    <div className="p-4 sm:p-6">
      <div className="space-y-6">
        <Card className="border border-border/60 bg-card/90 shadow-sm">
          <CardHeader className="gap-3">
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 xl:flex-1">
                <div className="space-y-2">
                  <Label htmlFor="shop-search">Search by name</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="shop-search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Central, Norte..."
                      className="pl-9"
                    />
                  </div>
                </div>

                <FilterSelect
                  id="shop-department"
                  label="Department"
                  placeholder="All departments"
                  icon={Building2}
                  value={departmentId}
                  disabled={filtersLoading || !!filtersError}
                  options={departmentsQuery.data ?? []}
                  onChange={(value) => {
                    setDepartmentId(value);
                    setMunicipalityId("all");
                  }}
                />

                <FilterSelect
                  id="shop-municipality"
                  label="Municipality"
                  placeholder={departmentId === "all" ? "Select a department first" : "All municipalities"}
                  icon={MapPinned}
                  value={municipalityId}
                  disabled={filtersLoading || !!filtersError || departmentId === "all"}
                  options={filteredMunicipalities}
                  onChange={setMunicipalityId}
                />
              </div>

              <CreateShopDialog />
            </div>

            {filtersError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {filtersError.message || "Something went wrong while loading filters."}
              </div>
            ) : null}

            <DataTable
              columns={columns}
              data={shopsQuery.data ?? []}
              isLoading={shopsQuery.isLoading}
              error={shopsQuery.error}
              emptyMessage="No shops match the current filters."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FilterSelect<T extends Department | Municipality>({
  id,
  label,
  placeholder,
  icon: Icon,
  value,
  disabled,
  options,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  icon: ComponentType<{ className?: string }>;
  value: string;
  disabled?: boolean;
  options: T[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className="w-full">
          <div className="flex items-center gap-2">
            <Icon className="size-4 text-muted-foreground" />
            <SelectValue placeholder={placeholder} />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={String(option.id)}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
