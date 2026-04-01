"use client";

import { useState } from "react";
import { RiUserAddLine } from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { CreateUserModal, type CreateUserAction } from "./CreateUserModal";

type UsersPageToolbarProps = {
  createUser: CreateUserAction;
};

export function UsersPageToolbar({ createUser }: UsersPageToolbarProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="crm-page-title">Users</h1>
        <Button type="button" onClick={() => setModalOpen(true)} className="shrink-0 gap-2">
          <RiUserAddLine className="h-4 w-4 shrink-0" aria-hidden />
          Create user
        </Button>
      </div>
      <CreateUserModal open={modalOpen} onOpenChange={setModalOpen} createUser={createUser} />
    </>
  );
}
