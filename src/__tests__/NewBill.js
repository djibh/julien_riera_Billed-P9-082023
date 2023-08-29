/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import "@testing-library/jest-dom"
import NewBill from "../containers/NewBill.js";
import userEvent from "@testing-library/user-event";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const windowIcon = screen.getByTestId('icon-mail')
      //to-do write expect expression
      expect(windowIcon).toHaveClass('active-icon')
    })

    test("Then the form should be rendered", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      expect(screen.getByText('Envoyer une note de frais')).toBeInTheDocument()
      const newBillForm = screen.getByTestId('form-new-bill')
      expect(newBillForm).toBeInTheDocument()
    })

    test("Then bill type should be a select input with 7 options", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const expenseTypeSelect = screen.getByTestId('expense-type')
      const optionsList = screen.getAllByRole('option')
      expect(expenseTypeSelect).toBeInTheDocument()
      expect(optionsList).toHaveLength(7)
    })

    test("Then file field should trigger a browser alert if the file has a wrong extension", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      jest.spyOn(window, 'alert').mockImplementation(() => {});

      const mockFile = {path: 'wrongFile.ext', type: 'ext'}

      const newBillController = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage
      })

      const handleChangeFile = jest.fn(newBillController.handleChangeFile)
      const fileInput = screen.getByTestId("file")
      fileInput.addEventListener('change', handleChangeFile)
      fireEvent.change(fileInput, {
        target: {
          files: [new File([mockFile["path"]], mockFile["path"], {type: mockFile["type"]})]
        }
      })
      
      expect(handleChangeFile).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalled()
    })
  })
})
